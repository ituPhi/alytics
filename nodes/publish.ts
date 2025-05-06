//const mdtext: string = f as string;
//const md = markdownToBlocks(mdtext);
import { Client } from "@notionhq/client";
// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

(async () => {
  const response = await notion.pages.create({
    parent: {
      type: "page_id",
      page_id: "1dd9084199fe8059b5afdcd322a46554",
    },
    properties: {
      title: [
        {
          text: {
            content: "Analytics Report", // Or whatever title you want
          },
        },
      ],
    },
    children:
      md as import("@notionhq/client/build/src/api-endpoints").BlockObjectRequest[], // Use the converted markdown blocks directly
  });
  console.log(response);
})();
