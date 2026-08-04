import { google, sheets_v4 } from "googleapis"

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>

export class Sheet {
  public refreshToken: string;
  private client: OAuth2Client;
  public sheetSerivce: sheets_v4.Sheets

  constructor(
    refreshToken?: string
  ) {
    this.refreshToken = refreshToken || "";
    this.client = this.getClient(process.env.NEXT_PUBLIC_REDIRECT_URI!);
    this.sheetSerivce = google.sheets({ version: "v4", auth: this.client })
  }

  private getClient(redirectUri: string) {
    const client = new google.auth.OAuth2({
      clientId: process.env.NEXT_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NEXT_GOOGLE_CLIENT_SECRET,
      redirectUri: `${redirectUri}/oauth/callback`,
    })

    if(this.refreshToken) client.setCredentials({
      refresh_token: this.refreshToken,
    })

    return client
  }

  async getToken(code: string) {
    try {
      const response = await this.client.getToken(code)
      console.log("--- getToken result ", response)
      return response.tokens
    } catch (error) {
      const err = error as Error;
      console.log("--- err ", err)
      console.log("--- error message ", err?.message)
      throw error
    }
  }

  getPersonalizedAuthUrl() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

    const authorizeUrl = this.client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });

    return authorizeUrl
  }
}