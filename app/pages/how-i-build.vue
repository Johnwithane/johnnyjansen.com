<script setup lang="ts">
useSeo({
  title: "How I build",
  description:
    "The operating manual behind every project: default-deny security rules with tests, validation at every boundary, strict TypeScript, mobile first, CI that refuses a red build, and AI coding tools used in the open.",
  path: "/how-i-build",
  type: "article",
  jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "How I build", path: "/how-i-build" }])],
});

const principles = [
  {
    title: "One feature at a time, fully shipped",
    body: "Nothing starts until the last thing is type checked, linted, tested where it matters, and committed. A half-built feature is worse than no feature.",
  },
  {
    title: "Default deny on security",
    body: "Every database collection gets an explicit rule for read, create, update and delete, and every rule gets at least one test that proves it allows the right person and one that proves it denies everyone else. Blue Seal has over 150 of these.",
  },
  {
    title: "Validate at the boundary",
    body: "Every server function input and every form has a schema. Raw payloads are never trusted, whoever sent them.",
  },
  {
    title: "No shortcuts in the type system",
    body: "Strict TypeScript throughout, no escape hatches. The compiler runs on every build and a type error is a failed build.",
  },
  {
    title: "Mobile first, 375 pixels wide",
    body: "Everything works on a mid-range phone before it is called done. Most of my users are on one.",
  },
  {
    title: "Backend changes deploy before the code that depends on them",
    body: "Rules, indexes and functions go live first, then the client that uses them. It is the most common way production quietly breaks, so it is a rule, not a preference.",
  },
  {
    title: "Offline is proven, not assumed",
    body: "For apps used with no signal, every feature is run in an offline browser before it ships, and the boot path has an automated test that cuts the network.",
  },
  {
    title: "Minimal by default",
    body: "Fewer buttons, fewer fields, fewer words. If a screen needs a paragraph to be understood, the screen gets redesigned instead.",
  },
];

const loop = [
  "Read the plan and the last ten commits",
  "Write a short plan: files to touch, approach, success criteria",
  "Build: types, schemas, services, rules, components, tests",
  "Verify: lint, type check, tests, and the change seen working in a real browser at phone width",
  "Deploy the backend half, confirm, then commit",
  "Update the help centre, the QA checklist and the human task list in the same commit",
];
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-14 md:py-20">
    <div class="prose-jj">
      <p class="eyebrow text-ink-3">How I build</p>
      <h1 class="mt-1 text-4xl font-bold">AI-native, with senior guardrails</h1>
      <p class="mt-4 text-lg">
        I build with AI coding tools, mostly Claude Code, and I say so up front. The tools are fast. What makes the
        result trustworthy is the discipline around them, and that discipline is written down in every repo I own as
        an operating manual the tools have to follow. This page is that manual in plain language.
      </p>
      <p>
        If you are the technical advisor a client brought in to check my work, this page is for you. Ask me for the
        repo. Everything below is enforced by the build, not by good intentions.
      </p>
    </div>

    <h2 class="mt-14 font-display text-2xl font-semibold">The rules that override everything else</h2>
    <ol class="mt-6 grid gap-4 md:grid-cols-2">
      <li v-for="(p, i) in principles" :key="p.title" class="rounded-lg border border-line bg-surface p-5">
        <p class="font-mono text-xs text-accent">{{ String(i + 1).padStart(2, "0") }}</p>
        <h3 class="mt-1 font-display text-lg font-semibold">{{ p.title }}</h3>
        <p class="mt-2 text-[15px] text-ink-2">{{ p.body }}</p>
      </li>
    </ol>

    <div class="mt-14 grid gap-10 md:grid-cols-2">
      <div class="prose-jj">
        <h2 class="text-2xl font-semibold">The loop, every feature</h2>
        <ol class="mt-4 list-decimal pl-5">
          <li v-for="step in loop" :key="step" class="mb-2 text-ink-2">{{ step }}</li>
        </ol>
      </div>
      <div class="prose-jj">
        <h2 class="text-2xl font-semibold">What the tooling enforces</h2>
        <ul class="mt-4">
          <li>ESLint and Prettier on every file, TypeScript strict mode with the type checker in the build</li>
          <li>Unit tests with Vitest, security rules tests against the Firebase emulator, end-to-end tests with Playwright</li>
          <li>GitHub Actions that run all of it on every push and deploy only when it is green</li>
          <li>A human task list in every repo for the steps only a person with console access can do</li>
          <li>A bug reporting loop from the live app that carries the state needed to reproduce the report</li>
        </ul>
        <h2 class="text-2xl font-semibold">What AI does and does not do</h2>
        <p>
          It writes most of the code, and it writes it inside the rules above. It does not decide the architecture,
          it does not get to skip a test, and it does not deploy. Where an AI assistant lives inside a product I
          build (BetterTour, Wishbone's admin), it proposes and a person confirms; it never has a privileged write
          path of its own.
        </p>
      </div>
    </div>

    <div class="mt-14">
      <OfferBand />
    </div>
  </div>
</template>
