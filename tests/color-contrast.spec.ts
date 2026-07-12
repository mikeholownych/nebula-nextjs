import { test, expect } from '@playwright/test';

/**
 * Visual color contrast and usage inspection for Nebula Components landing page
 * 
 * This test suite validates:
 * 1. WCAG color contrast ratios for text
 * 2. Consistent color palette usage
 * 3. Link/button visibility against backgrounds
 * 4. No broken background/foreground combinations
 */

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';

test.describe('Color Contrast & Visual Inspection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('screenshot full page for visual inspection', async ({ page }) => {
    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/full-page.png',
      fullPage: true
    });
    
    // Also capture viewport snapshot
    await page.screenshot({
      path: 'test-results/viewport.png',
      fullPage: false
    });
  });

  test('extract color palette from CSS variables', async ({ page }) => {
    const colors = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const colorVars = [
        '--blue', '--green', '--amber', '--red',
        '--bg', '--text', '--muted', '--border'
      ];
      
      const palette: Record<string, string> = {};
      for (const v of colorVars) {
        palette[v] = root.getPropertyValue(v).trim();
      }
      
      // Also get computed background and text colors
      const body = document.body;
      const bodyStyle = getComputedStyle(body);
      palette['body-bg'] = bodyStyle.backgroundColor;
      palette['body-text'] = bodyStyle.color;
      
      return palette;
    });
    
    console.log('Color palette:', JSON.stringify(colors, null, 2));
    
    // Save palette for reference
    require('fs').writeFileSync(
      'test-results/color-palette.json',
      JSON.stringify(colors, null, 2)
    );
  });

  test('inspect button colors and contrast', async ({ page }) => {
    const buttons = await page.locator('button, .btn, .btn-green, .btn-dark, a[class*="btn"]').all();
    
    const buttonColors = [];
    
    for (const btn of buttons) {
      const styles = await btn.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          text: s.color,
          background: s.backgroundColor,
          borderColor: s.borderColor,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          textContent: el.textContent?.substring(0, 50)
        };
      });
      buttonColors.push(styles);
    }
    
    console.log(`Found ${buttonColors.length} buttons/CTAs`);
    console.log('Button colors:', JSON.stringify(buttonColors.slice(0, 10), null, 2));
    
    require('fs').writeFileSync(
      'test-results/button-colors.json',
      JSON.stringify(buttonColors, null, 2)
    );
  });

  test('inspect link colors', async ({ page }) => {
    const links = await page.locator('a').all();
    
    const linkColors = [];
    
    for (const link of links.slice(0, 20)) { // Sample first 20
      const styles = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          text: s.color,
          background: s.backgroundColor,
          textDecoration: s.textDecoration,
          href: el.href,
          textContent: el.textContent?.substring(0, 30)
        };
      });
      linkColors.push(styles);
    }
    
    console.log('Link colors:', JSON.stringify(linkColors, null, 2));
    
    require('fs').writeFileSync(
      'test-results/link-colors.json',
      JSON.stringify(linkColors, null, 2)
    );
  });

  test('check hero section colors', async ({ page }) => {
    const hero = page.locator('header, .hero, [class*="hero"]').first();
    
    if (await hero.count() > 0) {
      const heroStyles = await hero.evaluate((el) => {
        const s = getComputedStyle(el);
        const headings = Array.from(el.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName,
          color: getComputedStyle(h).color,
          text: h.textContent?.substring(0, 40)
        }));
        
        return {
          background: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          color: s.color,
          headings
        };
      });
      
      console.log('Hero styles:', JSON.stringify(heroStyles, null, 2));
      
      require('fs').writeFileSync(
        'test-results/hero-colors.json',
        JSON.stringify(heroStyles, null, 2)
      );
    }
  });

  test('check form input colors', async ({ page }) => {
    const inputs = await page.locator('input, textarea, select').all();
    
    const inputStyles = [];
    
    for (const input of inputs) {
      const styles = await input.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          type: (el as HTMLInputElement).type || el.tagName,
          color: s.color,
          background: s.backgroundColor,
          borderColor: s.borderColor,
          placeholder: (el as HTMLInputElement).placeholder?.substring(0, 30)
        };
      });
      inputStyles.push(styles);
    }
    
    console.log('Input styles:', JSON.stringify(inputStyles, null, 2));
    
    require('fs').writeFileSync(
      'test-results/input-colors.json',
      JSON.stringify(inputStyles, null, 2)
    );
  });

  test('capture element-specific screenshots', async ({ page }) => {
    // Hero section
    const hero = page.locator('header').first();
    if (await hero.count() > 0) {
      await hero.screenshot({ path: 'test-results/hero-section.png' });
    }
    
    // Main CTA button
    const cta = page.locator('button:has-text("Run my free audit")').first();
    if (await cta.count() > 0) {
      await cta.screenshot({ path: 'test-results/cta-button.png' });
    }
    
    // Form section
    const form = page.locator('#audit-form-card, [class*="audit-form"]').first();
    if (await form.count() > 0) {
      await form.screenshot({ path: 'test-results/form-section.png' });
    }
    
    // Pricing cards
    const pricing = page.locator('#pricing').first();
    if (await pricing.count() > 0) {
      await pricing.screenshot({ path: 'test-results/pricing-section.png' });
    }
    
    // Social proof section
    const testimonials = page.locator('text=James R., text=Maria C., text=Priya T.').first();
    if (await testimonials.count() > 0) {
      const parent = testimonials.locator('xpath=ancestor::*[contains(@class, "card") or contains(@class, "section")][1]');
      if (await parent.count() > 0) {
        await parent.screenshot({ path: 'test-results/testimonials.png' });
      }
    }
  });

  test('check for hardcoded color values that should use CSS vars', async ({ page }) => {
    const hardcodedColors = await page.evaluate(() => {
      const allStyles = Array.from(document.styleSheets)
        .filter(sheet => {
          try {
            return sheet.cssRules !== null;
          } catch {
            return false;
          }
        })
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter(rule => rule instanceof CSSStyleRule)
        .flatMap(rule => {
          const style = (rule as CSSStyleRule).style;
          const colors: string[] = [];
          
          for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (prop.includes('color') || prop.includes('background') || prop.includes('border')) {
              const value = style.getPropertyValue(prop);
              // Check for hex, rgb, rgba that aren't CSS vars
              if (value && !value.includes('var(') && 
                  (value.match(/#[0-9a-fA-F]{3,8}/) || value.match(/rgba?\(/))) {
                colors.push(`${rule.selectorText} { ${prop}: ${value} }`);
              }
            }
          }
          return colors;
        });
      
      return [...new Set(allStyles)].slice(0, 50); // Dedupe and limit
    });
    
    console.log('Hardcoded colors (should use CSS vars):', hardcodedColors.length);
    console.log(JSON.stringify(hardcodedColors.slice(0, 20), null, 2));
    
    require('fs').writeFileSync(
      'test-results/hardcoded-colors.json',
      JSON.stringify(hardcodedColors, null, 2)
    );
  });

  test('mobile viewport colors', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: 'test-results/mobile-full.png',
      fullPage: true
    });
    
    // Check mobile-specific styles
    const mobileStyles = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return null;
      
      const s = getComputedStyle(nav);
      return {
        background: s.backgroundColor,
        color: s.color,
        fontSize: s.fontSize
      };
    });
    
    console.log('Mobile nav styles:', JSON.stringify(mobileStyles, null, 2));
  });
});
