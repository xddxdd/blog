import type { VFile } from 'vfile';

/**
 * Gopher protocol item types
 */
export type GopherItemType =
  | '0' // Text file
  | '1' // Directory/menu
  | '7' // Search
  | '8' // Telnet session
  | '9' // Binary file
  | 'g' // GIF image
  | 'h' // HTML file
  | 'I' // Image file
  | 's' // Sound file
  | 'i'; // Information line

/**
 * Plugin configuration options
 */
export interface RemarkGophermapOptions {
  /** Gopher server hostname */
  host?: string;
  /** Gopher server port */
  port?: string;
  /** Base path for relative links */
  baseSelector?: string;
  /** Maximum line length for text wrapping */
  maxLength?: number;
}

/**
 * Gopher item object structure
 */
export interface GopherItem {
  type: GopherItemType;
  text: string;
  selector: string;
  host: string;
  port: string;
}

/**
 * Extended VFile with gophermap data
 */
export interface GophermapVFile extends VFile {
  data: {
    gophermap?: string;
    [key: string]: unknown;
  };
}

// Re-export mdast types for convenience
export type { Root, Content, PhrasingContent } from 'mdast';
