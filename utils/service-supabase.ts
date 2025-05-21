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
