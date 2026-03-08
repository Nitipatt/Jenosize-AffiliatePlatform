import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { RedirectService } from './redirect.service';

@ApiTags('Redirect')
@Controller('go')
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':short_code')
  @ApiOperation({ summary: 'Redirect and track click' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to target URL',
    headers: { Location: { schema: { type: 'string' } } },
  })
  async redirect(
    @Param('short_code') shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const referrer = req.headers.referer ?? req.headers.referrer ?? undefined;
    const userAgent = req.headers['user-agent'];

    const targetUrl = await this.redirectService.resolve(
      shortCode,
      referrer as string | undefined,
      userAgent,
    );

    // Validate URL before redirect to prevent open redirect
    try {
      const parsed = new URL(targetUrl);
      const ALLOWED_REDIRECT_DOMAINS = [
        'shopee.co.th',
        'lazada.co.th',
      ];
      const isAllowed = ALLOWED_REDIRECT_DOMAINS.some(
        (domain) =>
          parsed.hostname === domain ||
          parsed.hostname.endsWith(`.${domain}`),
      );
      if (!isAllowed) {
        return res
          .status(400)
          .json({ message: 'Redirect to untrusted domain is not allowed' });
      }
    } catch {
      return res.status(400).json({ message: 'Invalid target URL' });
    }

    return res.redirect(302, targetUrl);
  }
}
