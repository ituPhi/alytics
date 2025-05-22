import { sbc } from "./clients";

export interface UserConfig {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  notion_access_token: string;
  ga_access_token: string;
  ga_refresh_token: string;
  ga_property_id: string;
  frequency: string;
  report_types: {
    user: boolean;
    country: boolean;
    analytics: boolean;
  };
  next_run: string;
}

export async function getUserDataById(id: string): Promise<UserConfig | null> {
  let { data: user_configs, error } = await sbc
    .from("user_configs")
    .select("*")
    .eq("user_id", id);

  if (user_configs && user_configs.length > 0) {
    //console.log(user_configs);
    return user_configs[0] as UserConfig;
  }
  return null;
}

export const getTodayUsers = async (): Promise<UserConfig[]> => {
  const today = new Date().toISOString().split("T")[0];
  let { data: users, error } = await sbc
    .from("user_configs")
    .select("*")
    .eq("next_run", today);
  if (error) console.error(error);
  if (users && users.length > 0) {
    return users as UserConfig[];
  }
  return [];
};

export async function updateUserNextRun(
  user: UserConfig,
  formattedNextRunDate,
) {
  // Update the user's next_run and updated_at in the database
  const { error: updateError } = await sbc
    .from("user_configs")
    .update({
      next_run: formattedNextRunDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
}
