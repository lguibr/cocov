
import { Project, SyntaxKind } from 'ts-morph';

/**
 * Checks if a specific line in a source file contains significant code.
 * Initializes a TS Project (expensive) so should be reused.
 */
export class SmartDiffChecker {
  private project: Project;

  constructor() {
    this.project = new Project({
        useInMemoryFileSystem: true,
        skipFileDependencyResolution: true, 
        compilerOptions: { allowJs: true }
    });
  }

  /**
   * Determines if a line is "ignorable" (whitespace, comments).
   * 
   * @param filePath Absolute path to file
   * @param content File content
   * @param lineNumber 1-based line number to check
   */
  isIgnorable(filePath: string, content: string, lineNumber: number): boolean {
    // 1. Trivial check: Whitespace
    const lineContent = content.split('\n')[lineNumber - 1];
    if (!lineContent || !lineContent.trim()) return true;

    // Only process JS/TS files
    if (!/\.[cm]?[jt]sx?$/.test(filePath)) {
        return false; // Assume significant for other languages
    }

    try {
      const sourceFile = this.project.createSourceFile(filePath, content, { overwrite: true });
      
      // Calculate position range for the line
      // ts-morph uses 0-based line indexing
      const lineIndex = lineNumber - 1;
      const start = sourceFile.compilerNode.getPositionOfLineAndCharacter(lineIndex, 0);
      const end = start + lineContent.length;

      // Identify if there is any "Significant" code in this range.
      // We check if the line falls completely within comments or is just trivia.
      
      // 1. Get all comment ranges in the file
      // We rely on getCommentRanges helper.

      const fullText = sourceFile.getFullText();
      const ranges = getCommentRanges(fullText, sourceFile.compilerNode);
      
      // Check if our line's non-whitespace content is covered by these ranges.
      // Find the first non-whitespace char on the line.
      const firstCharOffset = lineContent.search(/\S/);
      if (firstCharOffset === -1) return true; // Empty line handled, but just in case.
      
      const firstCharPos = start + firstCharOffset;
      
      // We can filter ranges that intersect our line.
      const lineRanges = ranges.filter(r => r.end > start && r.pos < end);
      
      if (lineRanges.length === 0) {
          return false;
      }
      
      // If we have comments, we need to remove them from the line text and see if anything remains.
      let effectiveLine = lineContent;
      
      // Adjust ranges to be relative to line
      for (const r of lineRanges) {
          const rStart = Math.max(r.pos, start);
          const rEnd = Math.min(r.end, end);
          
          const relStart = rStart - start;
          const relEnd = rEnd - start;
          
          // Replace with spaces to preserve length/indices if needed, or just remove.
          // Replacing with whitespace is safer.
          const before = effectiveLine.substring(0, relStart);
          const after = effectiveLine.substring(relEnd);
          const filler = ' '.repeat(relEnd - relStart);
          effectiveLine = before + filler + after;
      }
      
      return effectiveLine.trim().length === 0;

    } catch (e) {
      // Fallback to strict if AST fails
      return false;
    }
  }
}

// Helper to get all comment ranges from TS node
function getCommentRanges(text: string, node: any): {pos: number, end: number}[] {
    const result: {pos: number, end: number}[] = [];
    
    // Using TS scanner would be ideal but internal.
    // ts-morph doesn't expose `ts.getLeadingCommentRanges` directly on the module export easily without import ts.
    // But we can assume standard comment regex for this helper if we don't import `ts`.
    
    // Actually, `ts-morph` exports `ts` namespace often.
    // import { ts } from 'ts-morph';
    
    // Let's just use a robust regex for this helper since we have the full text.
    // Or iterate using ts-morph.
    
    // We can iterate Descendants and get their leading/trailing trivia.
    // That is robust.
    
    /*
    node.forEachChild(child => {
       // but comments can be anywhere.
    });
    */
   
    // Regex for both // and /* */
    const regex = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
    let match;
    while ((match = regex.exec(text)) !== null) {
        result.push({ pos: match.index, end: match.index + match[0].length });
    }
    return result;
}
