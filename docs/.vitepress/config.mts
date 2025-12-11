import { defineConfig } from "vitepress";
import type { HeadConfig, TransformContext } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    srcDir: "src",
    base: "/bidicalc/",

    title: "⇆ bidicalc",
    description: "A speadsheet where formulas also update backwards",
    appearance: false,
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Examples", link: "/markdown-examples" },
        ],

        sidebar: [
            {
                text: "Bidicalc",
                items: [
                    { text: "GitHub", link: "https://github.com/victorpoughon/bidicalc" },
                    { text: "Runtime API Examples", link: "/api-examples" },
                ],
            },
        ],

        socialLinks: [{ icon: "github", link: "https://github.com/victorpoughon/bidicalc" }],
    },
    markdown: {
        math: true,
    },

    // preload font
    transformHead(context: TransformContext): HeadConfig[] {
        const { assets } = context;

        const fontAsset = assets.find((asset) => asset.endsWith("Excalifont-Regular.woff2"));

        if (!fontAsset) return [];

        return [
            [
                "link",
                {
                    rel: "preload",
                    href: fontAsset,
                    as: "font",
                    type: "font/woff2",
                    crossorigin: "",
                },
            ],
        ];
    },
});
