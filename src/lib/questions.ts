export type Track = "developer" | "ops";

export interface Question {
  id: string;
  track: Track;
  prompt: string;
  /** Options in canonical order. `correct` indexes into this array. */
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  /** Shown on a wrong answer. */
  rationale: string;
}

export const TRACKS: Record<
  Track,
  { title: string; audience: string; description: string }
> = {
  developer: {
    title: "Developer",
    audience: "Engineers who consume the platform",
    description:
      "Deploy from the catalog, connect packages, read plans, debug failures.",
  },
  ops: {
    title: "Ops / Platform",
    audience: "Engineers who build and govern the platform",
    description:
      "Author bundles, define artifact types, write policy, run imports.",
  },
};

export const PASS_MARK = 16;
export const QUESTIONS_PER_ATTEMPT = 20;

const dev = (
  n: number,
  prompt: string,
  options: [string, string, string, string],
  correct: 0 | 1 | 2 | 3,
  rationale: string,
): Question => ({
  id: `D${n}`,
  track: "developer",
  prompt,
  options,
  correct,
  rationale,
});

const ops = (
  n: number,
  prompt: string,
  options: [string, string, string, string],
  correct: 0 | 1 | 2 | 3,
  rationale: string,
): Question => ({
  id: `O${n}`,
  track: "ops",
  prompt,
  options,
  correct,
  rationale,
});

export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------- Developer
  dev(
    1,
    "What is the difference between a bundle and a package?",
    [
      "A bundle is the Terraform module; a package is the Helm chart that deploys it",
      "A bundle is the reusable, published definition in the catalog; a package is an instance of that bundle configured and deployed in a specific environment",
      "They are the same thing; \"package\" is the CLI term and \"bundle\" is the UI term",
      "A package is the source repo; a bundle is the compiled release of it",
    ],
    1,
    "Bundle = published definition in the catalog; package = that bundle configured and deployed in one environment.",
  ),
  dev(
    2,
    "Where do a package's input parameters come from, and what validates them before a deploy?",
    [
      "From a terraform.tfvars file in your repo, validated by terraform validate",
      "From environment variables set on the runner, validated at apply time by the cloud provider",
      "From the bundle's params JSON Schema, which generates the form in the UI and validates values before the deploy starts",
      "From a shared spreadsheet the platform team maintains, validated by a CI job",
    ],
    2,
    "Params are JSON Schema; the schema drives the form and rejects bad values before any IaC runs.",
  ),
  dev(
    3,
    "Why can't you type a database connection string into another package's params by hand?",
    [
      "You can; it is just discouraged for security reasons",
      "Params are read-only once a package is deployed",
      "The connection is modeled as an artifact with a defined type; the consuming bundle declares a connection of that type, so the value is passed by linking packages, not by copy-paste",
      "Connection strings are encrypted and only the platform team can read them",
    ],
    2,
    "Connections are typed artifacts linked between packages; hand-typing bypasses the contract and the lineage.",
  ),
  dev(
    4,
    "Two packages are connected on the canvas. What flows across that line, and in which direction?",
    [
      "Network traffic, bidirectionally, through a Massdriver-managed service mesh",
      "An artifact emitted by the upstream package, flowing into a connection declared by the downstream package",
      "Terraform state, from the downstream package to the upstream one",
      "Nothing at runtime; the line is a visual annotation for documentation",
    ],
    1,
    "Upstream artifact flows into downstream connection. Not network traffic, not state.",
  ),
  dev(
    5,
    "What is a project vs. an environment, and which one holds the packages you deploy?",
    [
      "A project is a cloud account; an environment is a region within it; packages live in the region",
      "A project is a Git repository; an environment is a branch; packages are commits",
      "A project is a logical application or system; environments (dev, staging, prod) belong to the project, and packages are deployed inside an environment",
      "An environment is the top level; projects are folders inside it; packages live in projects",
    ],
    2,
    "Project holds environments; environments hold packages.",
  ),
  dev(
    6,
    "You need the same app stack in dev, staging, and prod. What do you duplicate and what do you not?",
    [
      "Duplicate the project three times, once per stage",
      "Keep one project, add an environment per stage, and deploy the same bundles into each with stage-appropriate params and connections; do not duplicate bundles",
      "Fork the bundles into bundle-dev, bundle-staging, bundle-prod so each stage has its own code",
      "Deploy once to prod and let Massdriver mirror it to dev and staging automatically",
    ],
    1,
    "One project, one environment per stage, same bundles, different params/connections. Never fork bundles per stage.",
  ),
  dev(
    7,
    "What is a preset, and when should you pick one instead of filling in params yourself?",
    [
      "A saved Terraform workspace; pick one when you want to reuse state",
      "A named set of param values the bundle author ships (for example \"development\" or \"production-ha\"); pick one when you want a sane starting configuration and then adjust only what differs",
      "A locked configuration that cannot be changed after selection",
      "A different version of the bundle with fewer inputs",
    ],
    1,
    "Presets are author-shipped param sets; start from one, change only what differs. They are not locked.",
  ),
  dev(
    8,
    "You change a param and hit deploy. Which statement about plan, approval, and apply is correct?",
    [
      "Deploy always runs plan and apply together with no stopping point",
      "Approval is a GitHub pull-request review; Massdriver has no concept of it",
      "A plan is generated first; whether an apply proceeds, and who may trigger or approve it, is governed by the org's policies and roles, so planning and applying can be held by different people",
      "Only the bundle author can run a plan",
    ],
    2,
    "Plan first; apply and approval are governed by org policy and roles, so they can sit with different people.",
  ),
  dev(
    9,
    "In a plan, how do you tell a destroy-and-recreate from an in-place update?",
    [
      "Both show as \"update\"; the only difference is the duration estimate",
      "A destroy-and-recreate is marked as a replacement (for example -/+ or \"must be replaced\"), typically triggered by changing an immutable attribute; an in-place update shows a ~ change on an existing resource",
      "Massdriver never destroys resources, so every change is in-place",
      "A replacement is shown only after the apply completes",
    ],
    1,
    "Replacement is marked explicitly (-/+ or \"must be replaced\"), usually from an immutable attribute change.",
  ),
  dev(
    10,
    "A deploy failed. Where do you look, and what does the package card's status tell you?",
    [
      "Check the cloud console only; Massdriver does not keep logs",
      "Open the package in Massdriver and read the provisioner logs for the failed step; the card status shows the package's deployment state (for example provisioning, running, failed), not the health of the application inside it",
      "The card status is red only if the application's health check fails; infrastructure errors are emailed",
      "Run terraform apply locally with the same inputs to reproduce it",
    ],
    1,
    "Provisioner logs live on the package in Massdriver; card status is deployment state, not app health.",
  ),
  dev(
    11,
    "How do you decommission a package, and what happens to packages connected downstream of it?",
    [
      "Delete the package from the canvas; downstream packages are automatically decommissioned with it",
      "Decommission the package through Massdriver so its IaC destroys the resources; downstream packages are not deleted, but they lose the artifact they were connected to and will fail or need a new connection",
      "Delete the cloud resources in the console; Massdriver detects this and removes the package",
      "You cannot decommission a package while anything is connected to it; Massdriver refuses",
    ],
    1,
    "Decommission runs the destroy; downstream packages are not deleted but lose their connection.",
  ),
  dev(
    12,
    "Your deploy was denied by a policy check. What produced the denial, and who do you talk to?",
    [
      "The cloud provider's IAM denied it; open a ticket with the cloud vendor",
      "A policy configured by your platform team (for example a Checkov rule or an org access rule) evaluated the plan or action and blocked it; the platform team owns the rule and its exceptions",
      "Massdriver's built-in security scanner, which cannot be changed by anyone",
      "Your own params schema; fix the JSON and redeploy",
    ],
    1,
    "Policy checks are configured by the platform team, who own exceptions. Not cloud IAM, not the schema.",
  ),
  dev(
    13,
    "What is a package's bundle version, and what happens when the bundle publisher releases a new one?",
    [
      "Deployed packages are upgraded automatically on the next release",
      "The version pins which published definition of the bundle the package was deployed from; a new release does not change running packages until someone chooses to update the package to it",
      "Versions apply only to artifacts, not bundles",
      "A new release silently redeploys every package in dev but not prod",
    ],
    1,
    "Version pins the definition; new releases never silently touch running packages.",
  ),
  dev(
    14,
    "How do you get the credentials or outputs of a running package into your application?",
    [
      "Copy them from the cloud console into your app's config file",
      "They are only visible in the Massdriver UI and cannot be exported",
      "Consume them through the artifact the package emits: connect your app's package to it, or download the artifact in the format your org standardized on (for example env vars or a kubeconfig)",
      "Massdriver injects them into every container in the cluster automatically",
    ],
    2,
    "Consume outputs through the artifact (connect or download in the standardized format). No console copy-paste.",
  ),
  dev(
    15,
    "Which two actions should you avoid once a resource is managed by Massdriver, and why?",
    [
      "Reading the resource in the console and tagging it, because both trigger a redeploy",
      "Changing its configuration in the cloud console and editing it with your own Terraform, because both create drift between the real resource and what Massdriver believes is deployed",
      "Viewing its logs and scaling it, because Massdriver owns observability",
      "There are no restrictions; Massdriver reconciles any change on its next poll",
    ],
    1,
    "Console edits and side-channel Terraform both cause drift; Massdriver does not auto-reconcile.",
  ),
  dev(
    16,
    "What is the mass CLI used for on the developer side? Pick the day-to-day command.",
    [
      "mass terraform apply, to apply infrastructure from your laptop",
      "mass pkg deploy <project>-<env>-<package>, to trigger a deploy of a configured package from a terminal or CI",
      "mass kubectl, a wrapper around kubectl",
      "mass login only; everything else is UI-only",
    ],
    1,
    "The mass CLI deploys configured packages from a terminal or CI; it is not a Terraform or kubectl wrapper.",
  ),
  dev(
    17,
    "How does Massdriver Architect / the Claude Code plugin fit in?",
    [
      "It deploys directly to prod from the chat window, skipping plan and approval",
      "It replaces the platform team by auto-publishing any bundle an agent writes",
      "It helps generate and configure bundles and deployments, but what it produces still goes through the same schemas, policies and ABAC checks as a human-made change",
      "It is a read-only chatbot for documentation",
    ],
    2,
    "Architect / the plugin generates; schemas, policy and ABAC still apply to what it produces.",
  ),
  dev(
    18,
    "You need infrastructure that is not in the catalog. What is the request path?",
    [
      "Write Terraform in your app repo and apply it yourself; add it to Massdriver later",
      "Request a new bundle from the platform team (or contribute one through the org's bundle review process); publishing to the catalog is the platform team's job",
      "Pick the closest bundle and edit its generated Terraform in the console",
      "Ask Massdriver support to write it",
    ],
    1,
    "New infrastructure = new bundle, owned by the platform team's review process.",
  ),
  dev(
    19,
    "Where can you see everything currently deployed in an environment and what depends on what?",
    [
      "In the cloud provider's resource-group view",
      "In a spreadsheet the platform team exports monthly",
      "On the environment's canvas (packages and the artifact lines between them), with the Context Engine available for querying relationships the canvas alone does not show",
      "Only by reading each bundle's Terraform source",
    ],
    2,
    "The canvas shows what is deployed and connected; the Context Engine answers relationship queries beyond it.",
  ),
  dev(
    20,
    "An upstream database package is redeployed and its endpoint changes. What happens to the app package connected to it?",
    [
      "Nothing until the app package is redeployed; the new artifact value is picked up on its next deploy, so changing an upstream dependency usually means redeploying downstream too",
      "The app package restarts automatically with the new endpoint",
      "The connection line turns red and must be re-drawn by hand",
      "The old endpoint keeps working because Massdriver proxies connections",
    ],
    0,
    "Downstream packages read artifact values at deploy time; an upstream change is picked up on the downstream's next deploy, not pushed live.",
  ),

  // ---------------------------------------------------------------- Ops / platform
  ops(
    1,
    "Which file set makes up a bundle, and what does each schema govern?",
    [
      "main.tf and variables.tf; the variables file governs everything",
      "massdriver.yaml plus params, connections and artifacts schemas and one or more IaC steps; params govern user inputs, connections govern what the bundle must receive from other packages, artifacts govern what it emits",
      "Chart.yaml and values.yaml; values govern inputs and outputs",
      "A single bundle.json that lists resources; Massdriver infers the schemas from Terraform",
    ],
    1,
    "massdriver.yaml + params/connections/artifacts schemas + IaC steps. Each schema governs inputs, inbound dependencies, outputs respectively.",
  ),
  ops(
    2,
    "Params, connections, and artifacts: which ones create the lines on the canvas?",
    [
      "Params, because each param is a dependency",
      "All three equally",
      "Connections and artifacts: an upstream package's artifact satisfying a downstream package's connection is a line; params are just the package's own inputs",
      "None; lines are drawn manually by the user",
    ],
    2,
    "Artifact satisfying a connection is the line. Params are local inputs.",
  ),
  ops(
    3,
    "What is an artifact type, and what happens if two bundles disagree on the shape of the same artifact type?",
    [
      "A file extension; a mismatch is ignored",
      "A shared JSON Schema contract (for example a Postgres authentication artifact) that both the emitting bundle and the consuming bundle reference; the type is defined once in the org, so bundles cannot disagree, they can only fail validation against it",
      "A Terraform output name; a mismatch is resolved by the newest bundle",
      "A Kubernetes CRD; a mismatch causes the cluster to reject the deploy",
    ],
    1,
    "Artifact types are org-level JSON Schema contracts; bundles conform to them, they cannot redefine them.",
  ),
  ops(
    4,
    "How do you publish a bundle, and what does a new version mean for packages already deployed from the previous one?",
    [
      "Push to the main branch; every package upgrades on the next cron run",
      "Publish with mass bundle publish (from a terminal or CI) so the new version lands in the catalog; existing packages keep their deployed version until each is explicitly updated",
      "Upload a zip in the UI; existing packages are redeployed immediately",
      "Publishing is done by Massdriver staff on request",
    ],
    1,
    "mass bundle publish puts a version in the catalog; deployed packages stay pinned until updated.",
  ),
  ops(
    5,
    "Given a working Terraform/OpenTofu module, what do you add to wrap it as a bundle, and what do you remove?",
    [
      "Add a Dockerfile; remove the provider blocks",
      "Add massdriver.yaml with params/connections/artifacts schemas and an artifact-emitting resource; remove hard-coded environment values and the backend/state config that Massdriver now manages, and map module variables to params and connections",
      "Nothing; any module is already a bundle",
      "Add a README.md; remove the outputs.tf file",
    ],
    1,
    "Add the Massdriver schemas and artifact emission; remove hard-coded env values and self-managed state/backend config.",
  ),
  ops(
    6,
    "How does a Helm chart become a bundle, and what supplies the kubeconfig?",
    [
      "Wrap the chart in a Helm-step bundle; the kubeconfig arrives as a Kubernetes cluster artifact through a connection from the cluster package, not from a file the user uploads",
      "Paste the kubeconfig into params as a string",
      "Install the chart manually; Massdriver imports it",
      "The chart becomes a bundle automatically when the cluster bundle is deployed",
    ],
    0,
    "Helm-step bundle; kubeconfig comes from the cluster package's artifact via a connection, never pasted.",
  ),
  ops(
    7,
    "What runs a deploy under the hood, and where do you look when a step hangs?",
    [
      "GitHub Actions; look at the Actions tab",
      "A local terraform apply on the user's laptop",
      "Massdriver's provisioning engine; check the provisioner logs for the hung step in the package's deployment view",
      "A cron job in the customer's cluster",
    ],
    2,
    "Massdriver's provisioning engine runs each step; a hung step means reading that step's provisioner logs.",
  ),
  ops(
    8,
    "How do you add a policy check such as Checkov or a custom rule, and scope it to prod only?",
    [
      "Policy checks are global and cannot be scoped",
      "Add the check at the bundle level and gate it with a condition on environment or package attributes (for example an attribute that marks production), so it runs only where the attribute matches",
      "Edit the Terraform module to refuse non-compliant inputs",
      "Ask developers to run Checkov locally before deploying",
    ],
    1,
    "Checks attach to bundles and are gated by attributes such as a prod marker. They are scopable.",
  ),
  ops(
    9,
    "Why does Massdriver ship few default attributes for ABAC, and what are attributes in your org?",
    [
      "Because ABAC is deprecated in favor of fixed roles",
      "Because attributes are org-defined labels (team, data classification, environment tier, cost center) attached to resources, environments and people; the platform ships a minimal set so each org models its own control boundaries instead of inheriting someone else's",
      "Because attributes are only used for billing",
      "Because attributes are read from cloud tags and cannot be defined in Massdriver",
    ],
    1,
    "Attributes are org-defined labels on resources, environments and people; few defaults so each org models its own boundaries.",
  ),
  ops(
    10,
    "Which attribute-and-rule combination lets developers plan anywhere but apply only in non-prod?",
    [
      "Give developers the Admin role; admins can plan and apply everywhere",
      "Attribute tier=prod on production environments; a rule granting developers plan on all environments and apply only where tier != prod",
      "Attribute developer=true on the person; a rule granting apply everywhere and relying on a manual approval email",
      "Separate Massdriver organizations for prod and non-prod",
    ],
    1,
    "tier=prod attribute; developers get plan everywhere, apply only where tier is not prod.",
  ),
  ops(
    11,
    "What is a service account token for, how do you scope it, and where would you use it?",
    [
      "It is a personal login for a human admin; it inherits everything that admin can do",
      "It is a non-human credential for CI or automation, scoped by the same roles and attributes as a person so it can, say, publish bundles or deploy to non-prod but nothing else; you store it as a CI secret for mass commands",
      "It is a cloud IAM key that Massdriver forwards to Terraform",
      "It is a one-time token used only during initial org setup",
    ],
    1,
    "Non-human identity, scoped by the same roles/attributes, stored as a CI secret.",
  ),
  ops(
    12,
    "Separation of duty: how do you configure a flow where a dev proposes an apply and a platform engineer approves it?",
    [
      "Give both groups the same role and rely on a Slack message before applying",
      "Grant developers plan on prod but withhold apply; grant platform engineers apply, so the developer's plan is reviewed and executed by someone who holds the apply permission",
      "Require a GitHub pull request on the bundle repo for every apply",
      "Enable two-factor authentication for developers",
    ],
    1,
    "Separation of duty is a permission split: dev holds plan, platform engineer holds apply.",
  ),
  ops(
    13,
    "You have an RDS instance created by hand. How do you bring it under management, and what does a governed import check?",
    [
      "Delete it and redeploy from a bundle; imports are not supported",
      "Run terraform import on your laptop and commit the state file to the bundle repo",
      "Import the resource into a package deployed from the matching bundle; the governed import checks that the real resource conforms to the bundle's schema and policies before accepting it, surfacing the differences as a plan rather than silently adopting it",
      "Tag the instance massdriver=true in AWS and it appears on the canvas",
    ],
    2,
    "Governed import validates the real resource against the bundle's schema and policy and shows differences as a plan.",
  ),
  ops(
    14,
    "How are cloud credentials modeled and attached so a bundle's IaC can use them?",
    [
      "Pasted into each package's params as access keys",
      "Stored in the bundle repo as an encrypted file",
      "As credential artifacts (for example an AWS IAM role artifact) created at the org level and attached to an environment as a default connection, so every package in that environment that declares the credential connection receives it",
      "Massdriver uses its own cloud account for all customers",
    ],
    2,
    "Credentials are org-level artifacts attached to an environment as default connections.",
  ),
  ops(
    15,
    "How do you share a bundle across organizations, and what stays private?",
    [
      "Bundles cannot be shared across organizations",
      "Publish the bundle to a shared or public catalog; the bundle definition and IaC are shared, while deployed packages, their params, artifacts, credentials and state remain inside each organization",
      "Export the Terraform state and send it to the other org",
      "Add the other org's users to your organization",
    ],
    1,
    "Shared: bundle definition and IaC. Private: packages, params, artifacts, credentials, state.",
  ),
  ops(
    16,
    "What does the Context Engine let you query that the canvas alone does not, and what is one incident-time question for it?",
    [
      "Nothing extra; it is the canvas rendered as text",
      "Cloud billing data only",
      "Relationships across packages, environments and artifacts as queryable structure, so you can ask \"which packages consume the artifact from this database that just failed over, across every environment\"",
      "Historical Slack messages about the project",
    ],
    2,
    "Context Engine makes relationships queryable across environments; canvas is one environment at a time.",
  ),
  ops(
    17,
    "How does the MCP server expose Massdriver to agents, and what still gates an agent's deploy?",
    [
      "It gives agents an admin API key that bypasses policy for speed",
      "It exposes Massdriver operations (catalog, packages, deploys, context) as tools an agent can call; the agent acts as a scoped identity and its deploys pass through the same ABAC, policy and approval path as a human's",
      "It is read-only; agents can never trigger a deploy",
      "It only exposes documentation search",
    ],
    1,
    "MCP exposes operations as tools; the agent is a scoped identity under the same ABAC/policy/approval path.",
  ),
  ops(
    18,
    "A developer reports drift. What is the first question you ask, and why doesn't Massdriver poll-and-reconcile by default?",
    [
      "\"Did you restart the cluster?\" Massdriver reconciles every 5 minutes so drift is impossible",
      "\"What changed outside Massdriver, and when?\" Automatic reconciliation would silently revert human changes (sometimes emergency fixes); Massdriver surfaces drift as a plan so a person decides whether to adopt or revert it",
      "\"Which Terraform version are you on?\" Drift is always a provider bug",
      "\"Who has console access?\" Massdriver blocks console access so drift cannot occur",
    ],
    1,
    "Ask what changed outside Massdriver; auto-reconcile would revert human (often emergency) changes without review.",
  ),
  ops(
    19,
    "A team wants a new \"tenant landing zone\" bundle. What should it emit so downstream app bundles can connect without knowing cluster internals?",
    [
      "A single string artifact containing a JSON blob of everything it created",
      "Nothing; downstream bundles should read the landing zone's Terraform state directly",
      "Typed artifacts for each thing downstream bundles consume (for example a Kubernetes cluster artifact with auth, a network/VPC artifact, an IAM/credential artifact, a DNS zone artifact), each conforming to an org-defined artifact type so app bundles declare a connection of that type and nothing else",
      "The raw kubeconfig and cloud access keys as params on every downstream package",
    ],
    2,
    "Emit typed artifacts per consumable (cluster, network, credential, DNS) so downstream declares only connections.",
  ),
  ops(
    20,
    "A bundle param must be one of three instance sizes. How do you make the UI render it as a dropdown and reject anything else?",
    [
      "Add a validation block in the Terraform variable; Massdriver reads it",
      "Document the three values in the param description and trust the user",
      "Write a custom policy check that fails the plan on an unknown size",
      "Declare the param in the params JSON Schema with an enum of the three values (optionally a default); the form renders a select and the schema rejects other values before any IaC runs",
    ],
    3,
    "JSON Schema enum on the param drives both the dropdown and the validation; Terraform validation and policy run too late and don't shape the form.",
  ),
];

export function questionsForTrack(track: Track): Question[] {
  return QUESTIONS.filter((q) => q.track === track);
}

export function questionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function isTrack(value: string): value is Track {
  return value === "developer" || value === "ops";
}
