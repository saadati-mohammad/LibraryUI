// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      // Correctness / hygiene rules.
      //
      // These were previously demoted to "warn" so the gate stayed usable while the dead
      // chat stack still existed. Now that the unreachable code is gone they are errors:
      // an explicit `any`, an unused binding, an empty lifecycle hook or a native/output
      // name collision all hide real defects, and a warning nobody reads is not a gate.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@angular-eslint/prefer-inject": "error",
      "@angular-eslint/no-empty-lifecycle-method": "error",
      "@angular-eslint/no-output-native": "error",
      "@angular-eslint/no-output-on-prefix": "error",
      // Angular 22's migration adds Eager explicitly to preserve pre-upgrade
      // change-detection semantics. Convert components to OnPush separately.
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
