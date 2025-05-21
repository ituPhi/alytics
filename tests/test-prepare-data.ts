import { getUserData } from "../utils/service-supabase";
import { runAllReports, getGoals } from "../utils/service-google";

let userConfig = await getUserData();
//console.log(userConfig);

if (!userConfig) {
  throw new Error("User configuration not found");
}
let state = {
  ga_access_token: userConfig.ga_access_token,
  ga_refresh_token: userConfig.ga_refresh_token,
  ga_property_id: userConfig.ga_property_id,
  userId: userConfig.id,
};

async function PrepareDataNode(state: any) {
  const { ga_access_token, ga_refresh_token, ga_property_id, userId } = state;
  const [data, goals] = await Promise.all([
    runAllReports(ga_access_token, ga_refresh_token, ga_property_id),
    getGoals(), // this need a user id to track their goals,
  ]);
  //console.log(data);
  return {
    data: data,
    goals: goals,
    userId: userId,
  };
}

const response = await PrepareDataNode(state);
console.log(response);
