import { visit } from "unist-util-visit";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import hpccWasm from "@hpcc-js/wasm/dist/index.node";
export const remarkGraphvizSvg = (options) => {
    // Destructure options
    const { language = "graphviz", graphvizEngine = "dot", } = (options ?? {});
    // transformer can be async
    return async function transformer(ast) {
        const instances = [];
        // visit can't be async
        visit(ast, { type: "code", lang: language }, (node, index, parent) => {
            instances.push([node.value, index, parent]);
        });
        // Convert svg to hast
        const processor = unified()
            .use(rehypeParse, { fragment: true, space: "svg" });
        // Wait for rendering all instances
        const diagrams = await Promise.all(instances.map(async ([code]) => {
            return await hpccWasm.graphviz
                .layout(code, "svg", graphvizEngine);
        }));
        // Replace original code snippets
        instances.forEach(([, index, parent], i) => {
            parent.children.splice(index, 1, {
                type: "paragraph",
                children: [{
                        type: "html",
                        value: diagrams[i]
                    }],
                data: {
                    hChildren: processor.parse(diagrams[i]).children
                }
            });
        });
    };
};
