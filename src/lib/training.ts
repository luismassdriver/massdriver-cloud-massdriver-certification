import type { Track } from "./questions";

/**
 * Training modules: one per track, five short sections each. Every section
 * has a few paragraphs, a screenshot of the real Massdriver app, and one or
 * two practice questions drawn from the certification question bank (by id),
 * so what you practise is exactly what the quiz asks.
 */

export interface TrainingSection {
  slug: string;
  title: string;
  minutes: number;
  /** Paragraphs. A paragraph starting with "- " renders as a bullet list item. */
  body: string[];
  screenshot: { src: string; alt: string; caption: string };
  /** Question ids from src/lib/questions.ts */
  practice: string[];
}

export interface TrainingModule {
  intro: string;
  sections: TrainingSection[];
}

export const TRAINING: Record<Track, TrainingModule> = {
  developer: {
    intro:
      "Everything a developer needs to deploy on Massdriver without touching Terraform: the canvas, the catalog, params and connections, and the plan → approve → apply loop. About 15 minutes.",
    sections: [
      {
        slug: "lay-of-the-land",
        title: "Projects, environments and the canvas",
        minutes: 3,
        body: [
          "Massdriver organises everything into **projects** and **environments**. A project is an application or system (this certification app is one). Inside a project you create environments — dev, staging, prod — and it is the environment that holds the packages you actually deploy. The same project can have an empty prod and a busy staging.",
          "A **bundle** is a reusable building block that the platform team publishes to the catalog: a Postgres database, a Kubernetes cluster, your app's Helm chart. When you drag a bundle from the catalog onto an environment's canvas it becomes a **package** (also called an instance): a configured, deployable copy of that bundle, living in that one environment.",
          "The canvas is the map of an environment. Each card is a package; each line between cards is a connection. Click a card to open it and you get tabs for its Config, History, Monitor, Dependencies and Resources. The catalog on the left lists every bundle your project is allowed to use.",
          "To stand up the same stack in another environment you copy the environment (or recreate the packages from the same bundles) — you never copy the cloud resources themselves, and you never copy the bundle; the bundle is shared.",
        ],
        screenshot: {
          src: "/training/canvas.jpg",
          alt: "A Massdriver environment canvas with three packages connected by lines, and the bundle catalog on the left",
          caption:
            "The Staging environment of this very app: a database package feeding two app packages, with the bundle catalog on the left.",
        },
        practice: ["D5", "D1"],
      },
      {
        slug: "params-and-connections",
        title: "Params, presets and connections",
        minutes: 4,
        body: [
          "Every package has **params**: the inputs the bundle author decided you may set. They are not free text. The bundle ships a JSON Schema for its params, Massdriver renders that schema as the form you see on the Config tab, and it rejects anything that does not validate before a deploy ever starts. If a field is a dropdown, the author made it an enum.",
          "A **preset** is a named set of param values the bundle author ships (\"Staging\", \"Production\"). Pick one to start from sensible values and change only what differs, instead of filling in every field.",
          "Some inputs are not params at all. Your app needs a database connection string, but you never type it: the database package **emits an artifact** (a typed record such as a `postgres-database` with host, port, user and password) and your app package declares a **connection** that expects that type. Drawing the line on the canvas wires the artifact into the app. That is what flows across the line, from the producer to the consumer, and it is why connections are typed: a bundle that expects a Kubernetes cluster cannot be connected to a database.",
          "Because the connection is live, when the upstream package is redeployed and its outputs change, the downstream package is marked as needing a deploy so it picks up the new values. The credentials themselves reach your application as environment variables or files the bundle sets up — read them from there, never copy them into params.",
        ],
        screenshot: {
          src: "/training/config.jpg",
          alt: "The Config tab of a package showing a form generated from the bundle's params schema",
          caption:
            "The Config tab is the bundle's params schema rendered as a form. Each field's help text comes from the bundle author.",
        },
        practice: ["D2", "D4"],
      },
      {
        slug: "plan-approve-apply",
        title: "Plan, approve, apply",
        minutes: 3,
        body: [
          "Clicking **Deploy** does not immediately change your cloud. The provisioner first runs a **plan** against the real infrastructure and shows exactly what would be added, changed or destroyed. Depending on how your platform team configured the environment, that plan may then need an **approval** before the **apply** step runs it.",
          "Read the plan. An in-place update shows a resource with `~` (changed); a destroy-and-recreate shows the same resource with `-/+` (must be replaced), which usually means downtime or data loss for that resource. If you did not expect a replacement, stop and ask before approving.",
          "Policy checks run in the same pipeline. If a check such as Checkov, or a custom rule, fails, the deploy is **denied** and the log tells you which rule produced the denial. The platform team owns those rules; the fix is a conversation with them (or a param change that satisfies the rule), not a workaround.",
          "Two things to avoid once Massdriver manages a resource: editing it by hand in the cloud console, and running Terraform against it from your laptop. Both create drift that the next plan will try to undo.",
        ],
        screenshot: {
          src: "/training/logs.jpg",
          alt: "Deployment logs showing a Terraform plan summary, Checkov policy evaluation and the apply completing",
          caption:
            "A real deploy log: the plan summary (0 to add, 1 to change, 0 to destroy), the Checkov policy check, then the apply.",
        },
        practice: ["D8", "D9"],
      },
      {
        slug: "when-things-go-wrong",
        title: "History, logs, versions and decommissioning",
        minutes: 3,
        body: [
          "Every deploy is recorded on the package's **History** tab with who ran it, how long it took, the commit or message it was deployed with, and a **View logs** link. The card on the canvas also shows a status badge: provisioned, provisioning, failed, decommissioned. When a deploy fails, the status turns red and the logs tell you which step failed and why.",
          "The **Dependencies** tab shows what this package expects (its connections) and what fulfils each one. A connection can be fulfilled by a specific package in the environment or by an **environment default** the platform team set up, such as a shared cluster.",
          "Each package is pinned to a **bundle version**. When the publisher releases a new version your package keeps running the old one until you choose to upgrade; nothing changes under you. The History tab shows the version each deploy used.",
          "To remove a package, **decommission** it. Massdriver destroys the cloud resources it created and the package disappears from the canvas. Anything connected downstream loses that artifact and will need a new connection (or decommissioning too) — so decommission from the leaves inward, never the database first.",
        ],
        screenshot: {
          src: "/training/history.jpg",
          alt: "The History tab listing deployments with status, duration, who deployed and View logs links",
          caption: "History: one row per deploy, with the message, the actor (here a CI service account) and a link to the logs.",
        },
        practice: ["D10", "D11"],
      },
      {
        slug: "beyond-the-ui",
        title: "The CLI, agents and asking for new bundles",
        minutes: 2,
        body: [
          "The `mass` CLI does what the UI does from a terminal, which is how CI deploys this app. The day-to-day developer command is `mass pkg deploy <project>-<env>-<package>` (`mass instance deploy` in the newer CLI): it deploys an already-configured package. It is not a Terraform or kubectl wrapper, and developers rarely need more than that one command; the authoring commands are for the platform team.",
          "Massdriver Architect and the Claude Code plugin let an agent read your canvas and propose changes. The agent still goes through the same plan, policy and approval steps as a person — it cannot skip governance.",
          "If the bundle you need is not in the catalog, the request path is the platform team: they author or vet a bundle, publish it, and it appears in the catalog for everyone. You do not hand-roll infrastructure outside Massdriver for a Massdriver project.",
          "The **Resources** page (left nav) lists everything deployed across the organisation, and an environment's canvas shows what depends on what inside it.",
        ],
        screenshot: {
          src: "/training/dependencies.jpg",
          alt: "The Dependencies tab showing fulfilled connections: a database package and an environment-default cluster",
          caption:
            "Dependencies: the app expects a Postgres database (fulfilled by the database package) and a Kubernetes cluster (fulfilled by an environment default).",
        },
        practice: ["D16", "D18"],
      },
    ],
  },
  ops: {
    intro:
      "What the platform team owns: authoring bundles, defining artifact types, publishing, and the governance that lets developers self-serve safely. About 15 minutes.",
    sections: [
      {
        slug: "anatomy-of-a-bundle",
        title: "Anatomy of a bundle",
        minutes: 4,
        body: [
          "A bundle is a directory with a `massdriver.yaml` manifest next to your IaC. The manifest declares the bundle's name and description, its **params** schema (the form developers fill in), its **connections** (artifact types it needs from other packages), the **resources** it emits (artifact types it produces for others), and the **steps** that run it — an OpenTofu/Terraform module, a Helm chart, or both.",
          "Params are JSON Schema. That schema does triple duty: it renders the Config form, it validates input before any IaC runs, and it documents the bundle. Want a dropdown that only accepts three instance sizes? Declare the param with an `enum` of those three values — the UI renders a select and anything else is rejected.",
          "Wrapping an existing Terraform module: keep the module, add `massdriver.yaml`, and replace the module's own variables and provider configuration with values Massdriver injects — params, connections (which carry credentials and endpoints) and the Massdriver provider. Remove hard-coded backends and credentials; the provisioner supplies state and auth.",
          "A Helm chart becomes a bundle the same way: the chart is the step, params map to values, and the kubeconfig comes from a `kubernetes-cluster` connection rather than from a file on anyone's laptop.",
        ],
        screenshot: {
          src: "/training/repos.jpg",
          alt: "The Repositories page listing bundles with their type, attributes and latest version",
          caption:
            "Repositories: every published bundle (and resource type) in the org, with its latest version. This is what fills the catalog.",
        },
        practice: ["O1", "O20"],
      },
      {
        slug: "artifacts-and-connections",
        title: "Artifact types: the contract between bundles",
        minutes: 3,
        body: [
          "An **artifact type** (resource type) is a named JSON Schema for something one bundle produces and another consumes — `postgres-database`, `kubernetes-cluster`, `web-endpoint`. It is the contract that makes connections typed. Only the lines on the canvas come from connections; params never draw a line.",
          "Both sides must agree on the shape. If a producer emits `{host, port, username, password}` and a consumer expects `{host, port, user, pass}`, the connection breaks at deploy time. Define the type once, in its own repository, and have every bundle reference that definition rather than inventing its own.",
          "Cloud credentials are modelled the same way: an authentication artifact (an AWS IAM role, for example) is attached to the environment, and bundles declare a connection to it. The IaC never sees a long-lived key; the provisioner assumes the role at deploy time.",
          "When designing a platform bundle such as a tenant landing zone, think about what downstream app bundles need to connect without ceremony: emit one artifact that carries the network, registry and repository together, so an app project needs a single connection instead of three.",
        ],
        screenshot: {
          src: "/training/repos-types.jpg",
          alt: "Repositories list showing both Bundles and Resource Types, e.g. aws-rds-postgres (bundle) and aws-vpc-network (resource type)",
          caption:
            "Bundles and resource types live side by side. A bundle produces or consumes the resource types; the types are the shared vocabulary.",
        },
        practice: ["O3", "O19"],
      },
      {
        slug: "publishing-and-versions",
        title: "Publishing, versions and sharing",
        minutes: 2,
        body: [
          "Publishing is a CLI step: `mass bundle build` validates the manifest and schemas, `mass bundle publish` pushes the bundle into its OCI repository in Massdriver. In CI this runs on every merge to main, which is exactly how this certification app's bundle is published.",
          "A new published version does not touch anything already deployed. Packages stay pinned to the version they were deployed with until someone upgrades them, so a bad release never rolls out on its own. Semantic versions tell developers what to expect from an upgrade.",
          "Bundles can be shared across organisations: the bundle definition and its IaC are visible to the receiving org, while your deployed packages, their params and their state stay private to you.",
        ],
        screenshot: {
          src: "/training/history.jpg",
          alt: "A package's History tab showing deploys made by the github-ci-certification service account",
          caption: "Deploys made by CI appear with the service account as the actor, each pinned to a bundle version.",
        },
        practice: ["O4", "O15"],
      },
      {
        slug: "governance",
        title: "Governance: attributes, policies and service accounts",
        minutes: 4,
        body: [
          "Access in Massdriver is **attribute-based** (ABAC). Rather than a fixed list of roles, you declare **attributes** for your organisation (team, tier, environment class…) and stamp them on projects, environments and bundles. A **group** of users or service accounts then gets rules such as \"may plan anywhere, may apply only where environment-class is non-prod\". Massdriver ships few default attributes on purpose: the ones that matter are the ones that describe your org.",
          "Separation of duty is a permission split, not a process document: grant developers **plan** on production but not **apply**, and grant platform engineers **apply**. A developer proposes the change and sees the plan; a platform engineer executes it, and the history records who did what.",
          "**Policy checks** such as Checkov or a custom rule run inside the deploy pipeline. Scope them with the same attributes — a stricter rule set for environments tagged prod — so developers get fast feedback in dev and a hard gate in production.",
          "**Service accounts** are non-human members: a token scoped through group membership, used by CI or an agent. Give a service account only the groups it needs; the CI account for this app can deploy to staging and nothing else.",
        ],
        screenshot: {
          src: "/training/attributes.jpg",
          alt: "Organization Settings → Attributes listing system attributes like md-project and md-environment",
          caption:
            "Attributes are the vocabulary for access rules. System attributes (md-*) come built in; you add the ones that describe your org.",
        },
        practice: ["O10", "O12"],
      },
      {
        slug: "running-the-platform",
        title: "Running the platform: provisioner, imports, drift and agents",
        minutes: 3,
        body: [
          "Under the hood every deploy is a workflow run by the **provisioner**: fetch the bundle, render params and connections, run the plan, evaluate policies, apply, publish artifacts. When a step hangs, the deploy's logs show which step is running and for how long; the surrounding workflow step tells you whether it is the IaC or Massdriver waiting.",
          "Existing resources — an RDS instance someone created by hand — are brought under management with a **governed import**: you create a package from the matching bundle and import the real resource into it. The import validates the resource against the bundle's schema and your policies and shows any differences as a plan, so you see what would change before anything does. From then on it is planned, policy-checked and approved like everything else.",
          "**Drift** is a change made outside Massdriver. Massdriver does not poll and reconcile on its own, because silently reverting a human's emergency fix is worse than showing it. The first question to ask is \"what changed outside the platform?\"; the next plan will show the difference and you decide.",
          "The **Context Engine** lets you query across the whole estate — which packages use bundle X below version Y, what is connected to this database — questions the canvas of one environment cannot answer. The **MCP server** exposes the same context to agents, and an agent's deploy still goes through plan, policy and approval.",
        ],
        screenshot: {
          src: "/training/groups.jpg",
          alt: "Organization Settings → Groups listing Organization Admin and Organization Viewer",
          caption: "Groups bundle people and service accounts; ABAC rules attach to groups.",
        },
        practice: ["O13", "O18"],
      },
    ],
  },
};

export function trainingFor(track: Track): TrainingModule {
  return TRAINING[track];
}

export function sectionByIndex(track: Track, index: number): TrainingSection | null {
  return TRAINING[track].sections[index] ?? null;
}
