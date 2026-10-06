terraform {
  required_version = ">= 1.0"
  required_providers {
    massdriver = {
      source  = "massdriver-cloud/massdriver"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.11"
    }
  }
}

locals {
  cluster = var.runtime.authentication.cluster
  ns      = coalesce(try(var.runtime.namespace, null), "apps")
  name    = var.md_metadata.name_prefix

  # Optional nested params arrive as null when unset; Helm needs strings.
  google_id     = try(var.configuration.google_oauth.client_id, null) == null ? "" : var.configuration.google_oauth.client_id
  google_secret = try(var.configuration.google_oauth.client_secret, null) == null ? "" : var.configuration.google_oauth.client_secret
  github_id     = try(var.configuration.github_oauth.client_id, null) == null ? "" : var.configuration.github_oauth.client_id
  github_secret = try(var.configuration.github_oauth.client_secret, null) == null ? "" : var.configuration.github_oauth.client_secret
  public_url_in = var.configuration.public_url == null ? "" : var.configuration.public_url

  database_url = format(
    "postgres://%s:%s@%s:%s/%s",
    urlencode(var.database.username),
    urlencode(var.database.password),
    var.database.host,
    var.database.port,
    var.database.database,
  )
}

provider "helm" {
  kubernetes {
    host                   = local.cluster.server
    cluster_ca_certificate = base64decode(local.cluster["certificate-authority-data"])
    token                  = var.runtime.authentication.user.token
  }
}

provider "kubernetes" {
  host                   = local.cluster.server
  cluster_ca_certificate = base64decode(local.cluster["certificate-authority-data"])
  token                  = var.runtime.authentication.user.token
}

# Signs session cookies. Generated once per instance and kept in state, so sessions
# survive redeploys but no one has to mint and paste a secret by hand.
resource "random_password" "auth_secret" {
  length  = 48
  special = false
}

resource "helm_release" "app" {
  name      = local.name
  chart     = "${path.module}/../chart"
  namespace = local.ns

  set {
    name  = "image.repository"
    value = var.image.repository
  }

  set {
    name  = "image.tag"
    value = var.image.tag
  }

  set {
    name  = "replicas"
    value = tostring(var.replicas)
  }

  set {
    name  = "resources.cpu"
    value = var.resources.cpu
  }

  set {
    name  = "resources.memory"
    value = var.resources.memory
  }

  set {
    name  = "app.devLogin"
    value = tostring(var.configuration.dev_login)
  }

  set {
    name  = "app.publicUrl"
    value = local.public_url_in
  }

  set {
    name  = "app.googleClientId"
    value = local.google_id
  }

  set {
    name  = "app.githubClientId"
    value = local.github_id
  }

  set_sensitive {
    name  = "secrets.databaseUrl"
    value = local.database_url
  }

  set_sensitive {
    name  = "secrets.authSecret"
    value = random_password.auth_secret.result
  }

  set_sensitive {
    name  = "secrets.googleClientSecret"
    value = local.google_secret
  }

  set_sensitive {
    name  = "secrets.githubClientSecret"
    value = local.github_secret
  }

  wait    = true
  timeout = 600
}

# The load balancer behind the ingress is named a little after Helm returns, so
# reading the address immediately gets an empty string. Wait only the first time:
# the same ingress keeps the same address across redeploys.
resource "time_sleep" "address" {
  create_duration = "90s"

  triggers = {
    ingress = "${local.ns}/${local.name}"
  }

  depends_on = [helm_release.app]
}

data "kubernetes_ingress_v1" "app" {
  metadata {
    name      = local.name
    namespace = local.ns
  }

  depends_on = [time_sleep.address]
}

locals {
  lb_hostname = try(data.kubernetes_ingress_v1.app.status[0].load_balancer[0].ingress[0].hostname, "")
  public_url  = local.public_url_in != "" ? local.public_url_in : "http://${local.lb_hostname}"
}
