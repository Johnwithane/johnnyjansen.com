import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/no-explicit-any": "error",
  },
}).append({
  ignores: ["public/**", "docs/legacy/**", ".output/**", ".nuxt/**"],
});
