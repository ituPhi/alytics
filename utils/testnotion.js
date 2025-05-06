import { Client } from "@notionhq/client";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

//(async () => { // get user list for workspace
//  const listUsersResponse = await notion.users.list({});
//  console.log(listUsersResponse);
//})();
//

//(async () => {
//  // this retrieves page properties
//  const pageId = "1dd9084199fe8059b5afdcd322a46554";
//  const response = await notion.pages.retrieve({ page_id: pageId });
//  console.log(response.proper);
//})();
//

// get content from a page block
(async () => {
  const blockId = "1dd9084199fe8059b5afdcd322a46554";
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 50,
  });
  const richTextHeading = response.results[0].heading_1;
  const content = richTextHeading.rich_text[0].plain_text;
  console.log(content);
})();

//create page as a child of another page
(async () => {
  const response = await notion.pages.create({
    cover: {
      type: "external",
      external: {
        url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg",
      },
    },
    icon: {
      type: "emoji",
      emoji: "🥬",
    },
    parent: {
      type: "page_id",
      page_id: "1dd9084199fe8059b5afdcd322a46554",
    },
    properties: {
      title: [
        {
          text: {
            content: "Tuscan kale",
          },
        },
      ],
    },
    children: [
      {
        object: "block",
        heading_2: {
          rich_text: [
            {
              text: {
                content: "Lacinato kale",
              },
            },
          ],
        },
      },
      {
        object: "block",
        paragraph: {
          rich_text: [
            {
              text: {
                content:
                  "Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.",
                link: {
                  url: "https://en.wikipedia.org/wiki/Lacinato_kale",
                },
              },
              href: "https://en.wikipedia.org/wiki/Lacinato_kale",
            },
          ],
          color: "default",
        },
      },
    ],
  });
  console.log(response);
})();
