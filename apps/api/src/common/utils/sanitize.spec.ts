import { sanitizePlainText, sanitizeRichText } from './sanitize';

describe('sanitize utilities', () => {
  it('strips script tags from rich text', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeRichText(input)).toBe('<p>Hello</p>');
  });

  it('keeps allowed formatting tags', () => {
    const input = '<p><strong>Bold</strong> and <a href="https://rotary.org">link</a></p>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('href="https://rotary.org"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('removes all HTML from plain text', () => {
    const input = '<b>Club</b> <img src=x onerror=alert(1)>';
    expect(sanitizePlainText(input)).toBe('Club');
  });
});
