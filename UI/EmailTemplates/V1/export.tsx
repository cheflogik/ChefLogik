import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

import LoyaltyRewardEmail from './src/app/components/LoyaltyRewardEmail';
import OTPEmail from './src/app/components/OTPEmail';
import OrderConfirmationEmail from './src/app/components/OrderConfirmationEmail';
import SignupEmail from './src/app/components/SignupEmail';

const templates = [
  { name: 'LoyaltyRewardEmail', component: LoyaltyRewardEmail },
  { name: 'OTPEmail', component: OTPEmail },
  { name: 'OrderConfirmationEmail', component: OrderConfirmationEmail },
  { name: 'SignupEmail', component: SignupEmail },
];

const outDir = path.join(process.cwd(), 'exported_templates');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

templates.forEach(({ name, component }) => {
  const html = renderToStaticMarkup(React.createElement(component));
  const fullHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${name}</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #F3F4F6;">\n${html}\n</body>\n</html>`;
  fs.writeFileSync(path.join(outDir, `${name}.html`), fullHtml);
  console.log(`Exported ${name}.html`);
});
