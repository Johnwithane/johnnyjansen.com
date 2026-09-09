<script setup lang="ts">
import { PERSON } from "~/data/site";
import { career } from "~/data/career";
import { reel, musicVideos, documentaries, series, awards } from "~/data/film";

useSeo({
  title: "About",
  description:
    "Johnny Jansen: fifteen years in brand, content and product for Disney, LEGO and Ocean Wise, then a startup that ran out of money as AI coding tools arrived. Now a full-stack builder in Kelowna, BC.",
  path: "/about",
  type: "profile",
  jsonLd: [personJsonLd(), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])],
});
</script>

<template>
  <div>
    <section class="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div class="grid gap-10 md:grid-cols-[1fr_320px]">
        <div class="prose-jj">
          <p class="eyebrow text-ink-3">About</p>
          <h1 class="mt-1 text-4xl font-bold">From the person who needed the software to the person who builds it</h1>
          <p class="mt-4 text-lg">
            I started as a filmmaker. For a decade I made brand and community content for Disney Interactive, LEGO,
            Ocean Wise and a games studio, directed music videos that won a Leo Award and a Juno nomination, and ran
            the creative side of a startup. Along the way I was always the person asking a developer for a feature
            and waiting.
          </p>
          <h2>Remoose changed that</h2>
          <p>
            In 2022, coming off the user generated content work I had done for LEGO Life, I started prototyping
            Remoose with Lance Priebe, the co-creator of Club Penguin, and Nicole Thompson: a remix tool for kids
            that turns a few taps into a looping animation someone else can remix. We incorporated in 2024. We ran
            out of funding right as the first AI coding tools appeared, and the team spent the next two years
            teaching me to build the thing myself. Remoose is live again, on a stack I rebuilt, and it is the
            portfolio piece that explains where the rest came from.
          </p>
          <h2>Then a real business</h2>
          <p>
            My father founded Wishbone Site Furnishings in 1995. When he sold the company I joined as Marketing
            Director, and there was an opportunity to build the company's whole digital infrastructure from nothing:
            the public site, the product information system, the link to the ERP, the configurator, the quoting. It
            launched in September 2026 and the team runs it every day. It is the clearest example of how I work: a
            working platform early, the team using it while it is built, every idea and bug filed from inside the
            app, and the platform kept running by the person who built it.
          </p>
          <p>
            Between the two I built products with people I love: a trades marketplace with my brother, a music
            world with my son, a tour management app with musicians, and a family archive for my wife's family.
            Each one is on the <NuxtLink to="/work">work page</NuxtLink>.
          </p>
          <p>I live in Kelowna, BC, with my family. I work with clients anywhere in Canada and the US.</p>
        </div>
        <div class="space-y-6">
          <img :src="PERSON.headshot" alt="Johnny Jansen" width="600" height="750" class="w-full rounded-lg object-cover" >
          <div class="rounded-lg border border-line bg-surface p-5 text-sm">
            <p class="eyebrow text-ink-3">Recognition</p>
            <ul class="mt-2 space-y-1 text-ink-2">
              <li v-for="a in awards" :key="a">{{ a }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="border-t border-line bg-surface-2">
      <div class="mx-auto max-w-6xl px-5 py-14">
        <p class="eyebrow text-ink-3">Career</p>
        <h2 class="mt-1 font-display text-2xl font-semibold">Where I have worked</h2>
        <ol class="mt-6 divide-y divide-line">
          <li v-for="r in career" :key="r.org + r.years" class="grid gap-1 py-4 md:grid-cols-[160px_1fr]">
            <p class="font-mono text-xs text-ink-3 md:pt-1">{{ r.years }}</p>
            <div>
              <p class="font-display font-semibold">{{ r.title }}, {{ r.org }}</p>
              <p class="text-[15px] text-ink-2">{{ r.summary }}</p>
            </div>
          </li>
        </ol>
        <p class="mt-6 text-sm"><NuxtLink to="/resume" class="text-accent">Full resume</NuxtLink></p>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <p class="eyebrow text-ink-3">Film and brand storytelling</p>
      <h2 class="mt-1 font-display text-2xl font-semibold">Where the product sense comes from</h2>
      <p class="prose-jj mt-3 text-ink-2">
        Fifteen years of making things people chose to watch. I do not sell this as a service any more, but it is
        why the products I build are designed around a story and not a schema. Click to play; nothing loads until
        you do.
      </p>
      <div class="mt-8 grid gap-6 md:grid-cols-2">
        <VideoEmbed :id="reel.id" :provider="reel.provider" :title="reel.title" />
        <VideoEmbed v-for="v in musicVideos.slice(0, 3)" :id="v.id" :key="v.id" :provider="v.provider" :title="v.title" />
      </div>

      <h3 class="mt-12 font-display text-xl font-semibold">Documentary</h3>
      <div class="mt-4 grid gap-6 md:grid-cols-2">
        <VideoEmbed v-for="v in documentaries" :id="v.id" :key="v.id" :provider="v.provider" :title="v.title" />
      </div>

      <h3 class="mt-12 font-display text-xl font-semibold">Series and campaigns</h3>
      <div class="mt-4 divide-y divide-line">
        <details v-for="s in series" :key="s.key" class="group py-4">
          <summary class="flex cursor-pointer list-none items-center gap-4">
            <span class="rounded bg-dark-bg px-2 py-1"><img :src="s.logo" :alt="s.client" class="h-5 w-auto" loading="lazy" ></span>
            <span class="font-display font-semibold">{{ s.title }}</span>
            <span class="text-sm text-ink-3">{{ s.client }} · {{ s.videos.length }} videos</span>
            <span class="ml-auto text-sm text-accent group-open:hidden">Open</span>
            <span class="ml-auto hidden text-sm text-accent group-open:inline">Close</span>
          </summary>
          <p class="prose-jj mt-3 text-[15px] text-ink-2">{{ s.description }}</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <VideoEmbed v-for="v in s.videos" :id="v.id" :key="v.id" :provider="v.provider" />
          </div>
        </details>
      </div>
    </section>
  </div>
</template>
