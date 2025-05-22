import { Client } from "@notionhq/client";

export async function getNotionPageId(query: string, notion: Client) {
  //find page id by query
  const results = await notion.search({
    query: query,
    sort: {
      direction: "ascending",
      timestamp: "last_edited_time",
    },
    filter: {
      value: "page",
      property: "object",
    },
  });

  const page = results.results.find(
    (p: any) => p.object === "page" && p.properties?.title,
  );
  return page?.id;
}

//const reportPage = pagesArray[0];
//let pageProperties = reportPage.properties;
//let title = pageProperties.title.title[0].plain_text;
//console.log(title);
