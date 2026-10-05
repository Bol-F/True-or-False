import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      ".pytest_cache/**",
      "ml/.venv/**",
      "ml/.pytest_cache/**",
      "ml/.ruff_cache/**",
      "ml/data/raw/**",
    ],
  },
];

export default eslintConfig;
