import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	test: {
		setupFiles: ["./test/setup.ts"],
		server: {
			deps: {
				inline: ["next"],
			},
		},
	},
	resolve: {
		alias: {
			"@": "/src",
		},
	},
});
