<script setup lang="ts">
import { PERSON, OFFER } from "~/data/site";

useSeo({
  title: "Contact",
  description: "Book a 30 minute call with Johnny Jansen about the digital platform behind your product business.",
  path: "/contact",
  jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])],
});

const endpoint = useRuntimeConfig().public.formEndpoint;
const state = ref<"idle" | "sending" | "sent" | "error">("idle");
const form = reactive({ name: "", email: "", company: "", website: "", message: "" });

async function submit() {
  if (!endpoint) return;
  state.value = "sending";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(form),
    });
    state.value = res.ok ? "sent" : "error";
  } catch {
    state.value = "error";
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-14 md:py-20">
    <div class="grid gap-12 md:grid-cols-[1fr_1fr]">
      <div class="prose-jj">
        <p class="eyebrow text-ink-3">Contact</p>
        <h1 class="mt-1 text-4xl font-bold">Tell me about the business</h1>
        <p class="mt-4 text-lg">
          Thirty minutes, no pitch. Send your website and I will have looked at it before we talk. If it makes
          sense, the next step is the {{ OFFER.name }}: {{ OFFER.price }}, {{ OFFER.duration.toLowerCase() }}, a
          written plan you keep either way.
        </p>
        <p>
          Projects like these are often eligible for
          <a href="https://www.bdc.ca/en/about/mediaroom/news-releases/bdc-launches-lift-getting-canadian-smes-off-the-ai-sidelines" rel="noopener" target="_blank">BDC LIFT</a>
          financing (with a preferential rate for choosing a Canadian integrator, which I am) and PacifiCan's
          scale-up program. I can walk you through both.
        </p>
        <p class="text-sm text-ink-3">
          Or email <a :href="`mailto:${PERSON.email}`">{{ PERSON.email }}</a>.
        </p>
      </div>

      <form v-if="state !== 'sent'" class="grid gap-4" @submit.prevent="submit">
        <label class="grid gap-1 text-sm">
          <span>Name</span>
          <input v-model="form.name" name="name" required autocomplete="name" class="rounded-md border border-line bg-surface px-3 py-2 text-base" >
        </label>
        <label class="grid gap-1 text-sm">
          <span>Email</span>
          <input v-model="form.email" name="email" type="email" required autocomplete="email" class="rounded-md border border-line bg-surface px-3 py-2 text-base" >
        </label>
        <label class="grid gap-1 text-sm">
          <span>Company</span>
          <input v-model="form.company" name="company" autocomplete="organization" class="rounded-md border border-line bg-surface px-3 py-2 text-base" >
        </label>
        <label class="grid gap-1 text-sm">
          <span>Your website</span>
          <input v-model="form.website" name="website" type="url" placeholder="https://" autocomplete="url" class="rounded-md border border-line bg-surface px-3 py-2 text-base" >
        </label>
        <label class="grid gap-1 text-sm">
          <span>What are you trying to do?</span>
          <textarea v-model="form.message" name="message" rows="5" required class="rounded-md border border-line bg-surface px-3 py-2 text-base" />
        </label>
        <button
          type="submit"
          :disabled="state === 'sending' || !endpoint"
          class="rounded-md bg-dark-bg px-5 py-3 text-sm font-semibold text-mint disabled:opacity-60"
        >
          {{ state === "sending" ? "Sending" : "Send" }}
        </button>
        <p v-if="state === 'error'" class="text-sm text-ink-2">
          That did not send. Email <a :href="`mailto:${PERSON.email}`" class="text-accent">{{ PERSON.email }}</a> instead.
        </p>
        <p v-if="!endpoint" class="text-sm text-ink-3">
          The form is not connected in this build. Email <a :href="`mailto:${PERSON.email}`" class="text-accent">{{ PERSON.email }}</a>.
        </p>
      </form>
      <div v-else class="rounded-lg border border-line bg-surface p-6">
        <p class="font-display text-xl font-semibold">Sent. I will reply within two working days.</p>
        <p class="mt-2 text-ink-2">If you included your website, I will have read it before we talk.</p>
      </div>
    </div>
  </div>
</template>
