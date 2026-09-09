<script setup lang="ts">
import { PERSON } from "~/data/site";
import { career } from "~/data/career";
import { reel, musicVideos, documentaries, series, awards } from "~/data/film";

useSeo({
  title: "About",
  description:
    "Johnny Jansen has always built systems that turn an audience's ideas into the next thing: Club Penguin, LEGO Life, Ocean Wise, then Remoose and Wishbone. Brand, product and code.",
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
          <h1 class="mt-1 text-4xl font-bold">I have always built systems that turn an audience's ideas into the next thing</h1>
          <p class="mt-4 text-lg">
            First with content. Now with software. The tools changed; the job did not.
          </p>
          <h2>Community systems, 2010 to 2019</h2>
          <p>
            At Disney Interactive I was Businesmoose, the in-game face of Club Penguin. The job looked like making
            videos. The job was actually a loop: read what the community was asking for, turn it into content, watch
            what they did with it, repeat. Sixty-one videos and fourteen million views came out of that loop, and so
            did the moderation and content systems behind them.
          </p>
          <p>
            At LEGO, Build Your Own Adventure made the loop the product. Kids voted on brick piles, submitted builds,
            and the story went where they sent it. Two seasons of user generated content on LEGO Life, with the voting
            and submission systems prototyped for the platform. At Ocean Wise the same shape ran three series and the
            exhibit screens at the Vancouver Aquarium. Even the music videos I am known for, Record Shop among them,
            were built the same way: complex systems planned to the frame, then shot.
          </p>
          <h2>Remoose, 2022 to today</h2>
          <p>
            Coming off the LEGO work I started prototyping Remoose with Lance Priebe, the co-creator of Club Penguin,
            and Nicole Thompson: a remix tool where a few taps make a looping animation someone else can remix. I did
            the brand, the product and the front end. We incorporated in 2024. We ran out of funding right as the
            first AI coding tools appeared, and the next two years turned me into the person who builds the system
            instead of the person who asks for it. Remoose is live again, on a stack I rebuilt.
          </p>
          <h2>Wishbone, 2025 to today</h2>
          <p>
            My father founded Wishbone Site Furnishings in 1995. When he sold the company I joined as Marketing
            Director. I tightened the brand first, then built the whole digital platform from nothing: the public
            site, the product information system, the link to the ERP, the configurator, the quoting. It launched in
            September 2026 and the team runs it every day, filing ideas and bugs from inside the admin. The same loop
            as Club Penguin, with a manufacturer's team instead of a community of kids.
          </p>
          <p>
            Between the two I built products with people I love, brand and code both: a trades marketplace with my
            brother, a music world with my son, a tour management app with musicians, and a family archive for my
            wife's family. Each one is on the <NuxtLink to="/work">work page</NuxtLink>.
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
