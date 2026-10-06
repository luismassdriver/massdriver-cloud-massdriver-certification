resource "massdriver_resource" "url" {
  field = "url"
  name  = coalesce(local.lb_hostname, local.name)

  resource = jsonencode({
    url      = local.public_url
    hostname = local.lb_hostname
  })
}
