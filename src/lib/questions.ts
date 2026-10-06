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
  //
  // Option lengths are deliberately balanced within each question. A test in
  // quiz.test.ts fails if the correct option is consistently the longest one,
  // because "pick the longest answer" must not be a winning strategy.
  dev(
    1,
    "What is the difference between a bundle and a package?",
    [
      "A bundle is the Terraform module; a package is the Helm chart that installs that module into a cluster",
      "A bundle is the published definition in the catalog; a package is one deployed, configured instance of it",
      "A bundle is the UI term and a package is the CLI term; they refer to exactly the same object",
      "A bundle is the Git repository holding the IaC; a package is a tagged, immutable release built from that repo",
    ],
    1,
    "Bundle = published definition in the catalog; package = that bundle configured and deployed in one environment.",
  ),
  dev(
    2,
    "Where do a package's input parameters come from, and what validates them before a deploy?",
    [
      "From a terraform.tfvars file committed to the bundle repo, validated by terraform validate in the CI pipeline",
      "From environment variables set on the provisioner, validated by the cloud provider only when the apply runs",
      "From the bundle's params JSON Schema, which renders the form and rejects bad values before IaC runs",
      "From a shared values spreadsheet the platform team owns, validated by a nightly consistency job",
    ],
    2,
    "Params are JSON Schema; the schema drives the form and rejects bad values before any IaC runs.",
  ),
  dev(
    3,
    "Why can't you type a database connection string into another package's params by hand?",
    [
      "You can, but each hand-typed value is flagged by the security scanner and needs an exception",
      "Params become read-only the moment a package is deployed, so only the platform team can edit them afterwards",
      "The connection is a typed artifact; a consumer declares that type and receives it by linking",
      "Connection strings are encrypted with the org key, and only members of the platform group can decrypt",
    ],
    2,
    "Connections are typed artifacts linked between packages; hand-typing bypasses the contract and the lineage.",
  ),
  dev(
    4,
    "Two packages are connected on the canvas. What flows across that line, and in which direction?",
    [
      "Network traffic in both directions, through a service mesh that Massdriver manages",
      "An artifact emitted by the upstream package, into a connection declared by the downstream package",
      "Terraform state, from the downstream package back to the upstream one",
      "Nothing at runtime; the line is a documentation annotation stored only in the canvas layout",
    ],
    1,
    "Upstream artifact flows into downstream connection. Not network traffic, not state.",
  ),
  dev(
    5,
    "What is a project vs. an environment, and which one holds the packages you deploy?",
    [
      "A project is a cloud account and an environment is a region inside that account; packages live in a region",
      "A project is a Git repository and an environment is a branch; packages are the commits on it",
      "A project is a logical system; its environments (dev, staging, prod) are where packages are deployed",
      "An environment is the top level and projects are folders inside it; packages live in a project",
    ],
    2,
    "Project holds environments; environments hold packages.",
  ),
  dev(
    6,
    "You need the same app stack in dev, staging, and prod. What do you duplicate and what do you not?",
    [
      "Duplicate the project once per stage so each team can own its own copy, its own settings and its own access",
      "One project, one environment per stage, the same bundles in each with stage-specific params",
      "Fork each bundle into -dev, -staging and -prod variants so a change in one stage can never leak into another",
      "Deploy to prod once and let Massdriver mirror the result into dev and staging on a nightly schedule",
    ],
    1,
    "One project, one environment per stage, same bundles, different params/connections. Never fork bundles per stage.",
  ),
  dev(
    7,
    "What is a preset, and when should you pick one instead of filling in params yourself?",
    [
      "A saved Terraform workspace; pick one when you want to reuse state from an earlier deploy",
      "A named set of param values shipped by the bundle author; start from it and change what differs",
      "A locked configuration that cannot be edited after selection; pick one for regulated or audited environments",
      "A different version of the bundle with fewer inputs; pick one whenever the full form is too complex to fill",
    ],
    1,
    "Presets are author-shipped param sets; start from one, change only what differs. They are not locked.",
  ),
  dev(
    8,
    "You change a param and hit deploy. Which statement about plan, approval, and apply is correct?",
    [
      "Deploy always runs plan and apply as a single step; there is no point at which the run can be stopped",
      "Approval happens as a GitHub pull-request review; Massdriver itself has no notion of approving",
      "A plan runs first; whether and who may apply or approve it is governed by org policy and roles",
      "Only the bundle's author can run a plan; everyone else can apply a plan that already exists",
    ],
    2,
    "Plan first; apply and approval are governed by org policy and roles, so they can sit with different people.",
  ),
  dev(
    9,
    "In a plan, how do you tell a destroy-and-recreate from an in-place update?",
    [
      "Both show as \"update\"; the only visible difference is the estimated duration of the change",
      "A replacement is marked (-/+ or \"must be replaced\"), usually from an immutable attribute change",
      "Massdriver never destroys a resource in a plan, so every change it shows is in-place",
      "A replacement is only revealed after the apply finishes, in the deployment's summary panel",
    ],
    1,
    "Replacement is marked explicitly (-/+ or \"must be replaced\"), usually from an immutable attribute change.",
  ),
  dev(
    10,
    "A deploy failed. Where do you look, and what does the package card's status tell you?",
    [
      "Check the cloud console's event history; Massdriver keeps no logs of its own for failed deploys",
      "Read the provisioner logs on the package; the card status is deployment state, not app health",
      "The card turns red only when the app's health check fails; infrastructure errors arrive by email",
      "Run terraform apply locally with the same inputs; the card status mirrors your local result",
    ],
    1,
    "Provisioner logs live on the package in Massdriver; card status is deployment state, not app health.",
  ),
  dev(
    11,
    "How do you decommission a package, and what happens to packages connected downstream of it?",
    [
      "Delete it from the canvas; downstream packages are decommissioned with it in order",
      "Decommission it in Massdriver so its IaC destroys resources; downstream packages lose the artifact",
      "Delete the cloud resources in the console; Massdriver detects the drift and removes the package",
      "You cannot; Massdriver refuses to decommission anything while a downstream connection exists",
    ],
    1,
    "Decommission runs the destroy; downstream packages are not deleted but lose their connection.",
  ),
  dev(
    12,
    "Your deploy was denied by a policy check. What produced the denial, and who do you talk to?",
    [
      "The cloud provider's IAM denied the apply; open a support ticket with the cloud vendor to get it lifted",
      "A rule your platform team configured (for example Checkov or an org access rule); they own exceptions",
      "Massdriver's built-in security scanner, whose rule set is fixed and cannot be changed or bypassed by anyone",
      "Your own params schema rejected the input; fix the JSON in the bundle repo and redeploy it",
    ],
    1,
    "Policy checks are configured by the platform team, who own exceptions. Not cloud IAM, not the schema.",
  ),
  dev(
    13,
    "What is a package's bundle version, and what happens when the bundle publisher releases a new one?",
    [
      "Deployed packages are upgraded automatically the next time the publisher cuts a release of the bundle",
      "It pins the definition the package was deployed from; a new release changes nothing until you update",
      "Versions apply only to artifacts, not bundles; a bundle release re-emits every package's artifacts",
      "A new release silently redeploys every package in dev, and prod waits for a manual promotion",
    ],
    1,
    "Version pins the definition; new releases never silently touch running packages.",
  ),
  dev(
    14,
    "How do you get the credentials or outputs of a running package into your application?",
    [
      "Copy them from the cloud console into your app's config file and rotate them on a fixed schedule",
      "They are visible only in the Massdriver UI and cannot be exported outside the browser session",
      "Through the artifact it emits: connect your app's package to it, or download it in the org's format",
      "Massdriver injects them as environment variables into every container running in the cluster",
    ],
    2,
    "Consume outputs through the artifact (connect or download in the standardized format). No console copy-paste.",
  ),
  dev(
    15,
    "Which two actions should you avoid once a resource is managed by Massdriver, and why?",
    [
      "Reading it in the console and tagging it, because both actions trigger an unplanned redeploy",
      "Editing it in the cloud console and with your own Terraform, because both create drift",
      "Viewing its logs and scaling it, because observability and capacity are owned by Massdriver",
      "Nothing is off limits; Massdriver reconciles any outside change on its next scheduled poll",
    ],
    1,
    "Console edits and side-channel Terraform both cause drift; Massdriver does not auto-reconcile.",
  ),
  dev(
    16,
    "What is the mass CLI used for on the developer side? Pick the day-to-day command.",
    [
      "mass terraform apply, to apply a bundle's infrastructure straight from your laptop with local state",
      "mass pkg deploy <project>-<env>-<package>, to deploy a configured package from a terminal or CI",
      "mass kubectl, a thin wrapper around kubectl that targets whichever cluster artifact is linked to the package",
      "mass login, to open the UI in a browser; every other operation is UI-only by design",
    ],
    1,
    "The mass CLI deploys configured packages from a terminal or CI; it is not a Terraform or kubectl wrapper.",
  ),
  dev(
    17,
    "How does Massdriver Architect / the Claude Code plugin fit in?",
    [
      "It deploys straight to prod from the chat window, skipping the plan and approval steps to save time",
      "It replaces the platform team by auto-publishing any bundle an agent writes to the catalog",
      "It generates bundles and configs, but its output goes through the same schemas, policies and ABAC",
      "It is a read-only documentation chatbot and cannot create or change anything in the org",
    ],
    2,
    "Architect / the plugin generates; schemas, policy and ABAC still apply to what it produces.",
  ),
  dev(
    18,
    "You need infrastructure that is not in the catalog. What is the request path?",
    [
      "Write Terraform in your app repo and apply it yourself; register it with Massdriver once it is running",
      "Request a bundle from the platform team or contribute one through the org's bundle review process",
      "Pick the closest bundle in the catalog and edit its generated Terraform directly in the cloud console",
      "Open a ticket with Massdriver support; their team writes and publishes bundles for customers",
    ],
    1,
    "New infrastructure = new bundle, owned by the platform team's review process.",
  ),
  dev(
    19,
    "Where can you see everything currently deployed in an environment and what depends on what?",
    [
      "In the cloud provider's resource-group view, filtered by the tags Massdriver writes on each resource",
      "In the dependency spreadsheet the platform team exports from the audit log at the end of each month",
      "On the environment's canvas, with the Context Engine for relationship queries it does not show",
      "Only by reading each bundle's Terraform source and tracing the module references by hand",
    ],
    2,
    "The canvas shows what is deployed and connected; the Context Engine answers relationship queries beyond it.",
  ),
  dev(
    20,
    "An upstream database package is redeployed and its endpoint changes. What happens to the app package connected to it?",
    [
      "Nothing until the app package is redeployed; it reads the new artifact value on its next deploy",
      "The app package restarts automatically with the new endpoint, since the artifact is watched live",
      "The connection line turns red and must be deleted and drawn again by hand before the app can deploy",
      "The old endpoint keeps working because Massdriver proxies the connection and follows the move transparently",
    ],
    0,
    "Downstream packages read artifact values at deploy time; an upstream change is picked up on the downstream's next deploy, not pushed live.",
  ),

  // ---------------------------------------------------------------- Ops / platform
  ops(
    1,
    "Which file set makes up a bundle, and what does each schema govern?",
    [
      "main.tf and variables.tf; the variables file governs inputs, dependencies and outputs all at once",
      "massdriver.yaml, params/connections/artifacts schemas and IaC steps; inputs, dependencies, outputs",
      "Chart.yaml and values.yaml; values governs inputs and outputs, Chart.yaml governs dependencies",
      "A single bundle.json listing resources; Massdriver infers all three schemas from the Terraform",
    ],
    1,
    "massdriver.yaml + params/connections/artifacts schemas + IaC steps. Each schema governs inputs, inbound dependencies, outputs respectively.",
  ),
  ops(
    2,
    "Params, connections, and artifacts: which ones create the lines on the canvas?",
    [
      "Params, because each param that references another package is rendered as a dependency line",
      "All three equally; every schema entry is rendered as a line to whatever it references",
      "Connections and artifacts: an upstream artifact satisfying a downstream connection is a line",
      "None of them; lines are drawn by hand on the canvas and stored only in the layout metadata",
    ],
    2,
    "Artifact satisfying a connection is the line. Params are local inputs.",
  ),
  ops(
    3,
    "What is an artifact type, and what happens if two bundles disagree on the shape of the same artifact type?",
    [
      "A file extension on the artifact; a mismatch is ignored and the raw value is passed straight through",
      "An org-level JSON Schema contract both sides reference; bundles can only fail validation against it",
      "A Terraform output name; a mismatch is resolved in favor of whichever bundle was published most recently",
      "A Kubernetes CRD installed on the cluster; a mismatch makes the cluster's admission webhook reject the deploy",
    ],
    1,
    "Artifact types are org-level JSON Schema contracts; bundles conform to them, they cannot redefine them.",
  ),
  ops(
    4,
    "How do you publish a bundle, and what does a new version mean for packages already deployed from the previous one?",
    [
      "Push to the main branch of the catalog repo; each package upgrades on the next scheduled run",
      "Run mass bundle publish from a terminal or CI; deployed packages stay pinned until updated",
      "Upload a zip of the bundle in the UI; packages deployed from it are redeployed immediately",
      "Publishing is done by Massdriver staff on request; existing packages are migrated as part of that work",
    ],
    1,
    "mass bundle publish puts a version in the catalog; deployed packages stay pinned until updated.",
  ),
  ops(
    5,
    "Given a working Terraform/OpenTofu module, what do you add to wrap it as a bundle, and what do you remove?",
    [
      "Add a Dockerfile that runs the module; remove the provider blocks, which Massdriver supplies at deploy",
      "Add massdriver.yaml with schemas and artifact emission; remove hard-coded values and backend config",
      "Add nothing; any module in a Git repository is already a bundle once the repository is registered",
      "Add a README.md describing the inputs; remove outputs.tf, since emitted artifacts replace Terraform outputs",
    ],
    1,
    "Add the Massdriver schemas and artifact emission; remove hard-coded env values and self-managed state/backend config.",
  ),
  ops(
    6,
    "How does a Helm chart become a bundle, and what supplies the kubeconfig?",
    [
      "Wrap it in a Helm-step bundle; the kubeconfig arrives as a cluster artifact through a connection",
      "Wrap it in a Helm-step bundle; the kubeconfig is pasted into a sensitive string param at deploy time",
      "Install the chart manually once; Massdriver imports the release and reads the cluster from it",
      "It becomes a bundle automatically when the cluster bundle is deployed with the chart's repo URL",
    ],
    0,
    "Helm-step bundle; kubeconfig comes from the cluster package's artifact via a connection, never pasted.",
  ),
  ops(
    7,
    "What runs a deploy under the hood, and where do you look when a step hangs?",
    [
      "GitHub Actions in the bundle's repo; look at the Actions tab for the run that the deploy triggered",
      "A terraform apply on the laptop of whoever clicked deploy; look at that person's terminal for the output",
      "Massdriver's provisioning engine; look at the provisioner logs for the hung step on the package",
      "A cron job inside the customer's own cluster; look at the job's pod logs with kubectl in that namespace",
    ],
    2,
    "Massdriver's provisioning engine runs each step; a hung step means reading that step's provisioner logs.",
  ),
  ops(
    8,
    "How do you add a policy check such as Checkov or a custom rule, and scope it to prod only?",
    [
      "Policy checks are global once enabled; scoping is done by excluding bundles from the catalog",
      "Attach the check to the bundle and gate it on an attribute such as a production marker",
      "Edit the Terraform module to refuse non-compliant inputs when the workspace name is prod",
      "Ask developers to run Checkov locally before deploying and attach the report to the plan",
    ],
    1,
    "Checks attach to bundles and are gated by attributes such as a prod marker. They are scopable.",
  ),
  ops(
    9,
    "Why does Massdriver ship few default attributes for ABAC, and what are attributes in your org?",
    [
      "Because ABAC is deprecated in favor of fixed roles; attributes remain only for backwards compatibility",
      "Because attributes are org-defined labels on resources, environments and people; each org defines its own",
      "Because attributes are used only for cost reporting; access decisions are made from roles alone",
      "Because attributes are read from cloud tags at deploy time and cannot be defined inside Massdriver",
    ],
    1,
    "Attributes are org-defined labels on resources, environments and people; few defaults so each org models its own boundaries.",
  ),
  ops(
    10,
    "Which attribute-and-rule combination lets developers plan anywhere but apply only in non-prod?",
    [
      "Give developers the Admin role for non-prod projects; admins can plan and apply in every environment",
      "Attribute tier=prod on production; grant developers plan everywhere and apply where tier != prod",
      "Attribute developer=true on each person; grant apply everywhere and require an approval email first",
      "Separate Massdriver organizations for prod and non-prod, with developers invited only to the non-prod one",
    ],
    1,
    "tier=prod attribute; developers get plan everywhere, apply only where tier is not prod.",
  ),
  ops(
    11,
    "What is a service account token for, how do you scope it, and where would you use it?",
    [
      "A personal login for an admin; it inherits everything that admin can do and lives in a password manager",
      "A non-human credential for CI, scoped by the same roles and attributes as a person; stored as a CI secret",
      "A cloud IAM key that Massdriver forwards to Terraform; scoped by the cloud role, stored in the bundle",
      "A one-time token used only during initial org setup; scoped to org creation and discarded afterwards",
    ],
    1,
    "Non-human identity, scoped by the same roles/attributes, stored as a CI secret.",
  ),
  ops(
    12,
    "Separation of duty: how do you configure a flow where a dev proposes an apply and a platform engineer approves it?",
    [
      "Give both groups the same role and require a Slack acknowledgement before anyone applies",
      "Grant developers plan on prod but not apply; grant platform engineers apply, so they execute the plan",
      "Require a GitHub pull request on the bundle repo for every apply, reviewed and merged by a platform engineer",
      "Enable two-factor authentication for developers so each apply needs a second device to confirm",
    ],
    1,
    "Separation of duty is a permission split: dev holds plan, platform engineer holds apply.",
  ),
  ops(
    13,
    "You have an RDS instance created by hand. How do you bring it under management, and what does a governed import check?",
    [
      "Delete it and redeploy from a bundle; imports are unsupported because state must start empty",
      "Run terraform import on your laptop and commit the resulting state file to the bundle's Git repository",
      "Import it into a package from the matching bundle; the import checks schema and policy, shown as a plan",
      "Tag the instance massdriver=true in AWS; the next sync adopts it and draws it on the canvas",
    ],
    2,
    "Governed import validates the real resource against the bundle's schema and policy and shows differences as a plan.",
  ),
  ops(
    14,
    "How are cloud credentials modeled and attached so a bundle's IaC can use them?",
    [
      "Pasted into each package's params as access keys, marked sensitive so they are masked in the UI and logs",
      "Stored in the bundle repo as an encrypted file that the provisioner decrypts with the org key at deploy",
      "As org-level credential artifacts attached to an environment as default connections for packages",
      "Massdriver uses its own cloud account for every customer and bills the usage back to them per package",
    ],
    2,
    "Credentials are org-level artifacts attached to an environment as default connections.",
  ),
  ops(
    15,
    "How do you share a bundle across organizations, and what stays private?",
    [
      "Bundles cannot be shared across organizations; each org must publish its own copy of the source",
      "Publish it to a shared or public catalog; packages, params, artifacts, credentials and state stay private",
      "Export the Terraform state and send it to the other org; the state carries the bundle definition",
      "Add the other org's users to your organization; they can then deploy from your catalog directly",
    ],
    1,
    "Shared: bundle definition and IaC. Private: packages, params, artifacts, credentials, state.",
  ),
  ops(
    16,
    "What does the Context Engine let you query that the canvas alone does not, and what is one incident-time question for it?",
    [
      "Nothing extra; it is the current canvas rendered as text so it can be pasted into a ticket",
      "Cloud billing by package; for example \"which package's spend doubled in the last hour\"",
      "Relationships across environments; for example \"which packages consume this failed database\"",
      "Historical Slack messages about the project; for example \"who last discussed this outage, and when\"",
    ],
    2,
    "Context Engine makes relationships queryable across environments; canvas is one environment at a time.",
  ),
  ops(
    17,
    "How does the MCP server expose Massdriver to agents, and what still gates an agent's deploy?",
    [
      "It gives agents an admin API key that bypasses policy checks so that automated deploys stay fast",
      "It exposes operations as tools; the agent is a scoped identity under the same ABAC and approvals",
      "It is read-only; agents can inspect the catalog and packages but can never trigger a deploy",
      "It only exposes documentation search; deploys still need a human to click in the UI",
    ],
    1,
    "MCP exposes operations as tools; the agent is a scoped identity under the same ABAC/policy/approval path.",
  ),
  ops(
    18,
    "A developer reports drift. What is the first question you ask, and why doesn't Massdriver poll-and-reconcile by default?",
    [
      "\"Did you restart the cluster?\" Massdriver reconciles every five minutes, so real drift is nearly impossible",
      "\"What changed outside Massdriver?\" Auto-reconcile would silently revert human fixes; drift is a plan",
      "\"Which Terraform version are you on?\" Drift is nearly always a provider bug, not a real change",
      "\"Who has console access?\" Massdriver blocks all console access, so drift means a credential leaked somewhere",
    ],
    1,
    "Ask what changed outside Massdriver; auto-reconcile would revert human (often emergency) changes without review.",
  ),
  ops(
    19,
    "A team wants a new \"tenant landing zone\" bundle. What should it emit so downstream app bundles can connect without knowing cluster internals?",
    [
      "A single string artifact holding a JSON blob of everything it created, parsed by each consumer at deploy",
      "Nothing; downstream bundles should read the landing zone's Terraform state directly through a data source",
      "Typed artifacts per consumable (cluster, network, credential, DNS) so apps declare only connections",
      "The raw kubeconfig and cloud access keys, set as sensitive params on every downstream package that needs them",
    ],
    2,
    "Emit typed artifacts per consumable (cluster, network, credential, DNS) so downstream declares only connections.",
  ),
  ops(
    20,
    "A bundle param must be one of three instance sizes. How do you make the UI render it as a dropdown and reject anything else?",
    [
      "Add a validation block to the Terraform variable; Massdriver reads it at build time to generate the form control",
      "List the three values in the param's description and rely on the user to type one of them correctly",
      "Write a custom policy check that fails the plan whenever an unknown size value reaches the provisioner",
      "Declare an enum of the three values in the params JSON Schema; it renders a select and validates",
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
