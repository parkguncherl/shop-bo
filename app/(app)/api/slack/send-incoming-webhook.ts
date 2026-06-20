import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    if (!req.body) {
      res.statusCode = 400;
      return res.send('메시지가 없습니다.');
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_SLACK_WEB_HOOKS_URL}`;
      const response = await axios.post(url, req.body);
      console.debug('Message sent to Slack successfully', response.status);
    } catch (error) {
      console.error('Error sending message to Slack', error);
    }
  }
};
