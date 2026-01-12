const blogpostMarkdown = `# control

*humans should focus on bigger problems*

## Setup

\`\`\`bash
git clone git@github.com:anysphere/control
\`\`\`

\`\`\`bash
./init.sh
\`\`\`

## Folder structure

**The most important folders are:**

1. \`vscode\`: this is our fork of vscode, as a submodule.
2. \`milvus\`: this is where our Rust server code lives.
3. \`schema\`: this is our Protobuf definitions for communication between the client and the server.

## Releasing

\`\`\`
git checkout build-todesktop
git merge main
git push origin build-todesktop
\`\`\`
`;

let currentContainer: HTMLElement | null = null;

/* ============================
   STREAM SETUP (DO NOT EDIT)
============================ */
function runStream() {
  currentContainer = document.getElementById('markdownContainer')!;

  const tokens: string[] = [];
  let remaining = blogpostMarkdown;

  while (remaining.length > 0) {
    const len = Math.floor(Math.random() * 18) + 2;
    tokens.push(remaining.slice(0, len));
    remaining = remaining.slice(len);
  }

  const interval = setInterval(() => {
    const token = tokens.shift();
    if (token) addToken(token);
    else clearInterval(interval);
  }, 20);
}

/* ============================
   PARSER STATE
============================ */
let mode: 'normal' | 'inline' | 'block' = 'normal';
let backtickCount = 0;
let activeNode: HTMLElement | null = null;

let lineStart = true;
let headingCount = 0;

let starCount = 0;
let italicOpen = false;

/* ============================
   STREAMING PARSER
============================ */
function addToken(token: string) {
  if (!currentContainer) return;

  for (let i = 0; i < token.length; i++) {
    const ch = token[i];

    /* ---------- CODE HANDLING ---------- */
    if (ch === '`') {
      backtickCount++;

      if (backtickCount === 3) {
        backtickCount = 0;

        if (mode === 'block') {
          mode = 'normal';
          activeNode = null;
        } else {
          mode = 'block';
          const pre = document.createElement('pre');
          pre.style.background = '#1e1e1e';
          pre.style.color = '#d4d4d4';
          pre.style.padding = '12px';
          pre.style.borderRadius = '6px';
          pre.style.margin = '10px 0';
          pre.style.fontFamily = 'monospace';
          currentContainer.appendChild(pre);
          activeNode = pre;
        }
        continue;
      }
      continue;
    }

    if (backtickCount === 1) {
      backtickCount = 0;

      if (mode === 'inline') {
        mode = 'normal';
        activeNode = null;
      } else {
        mode = 'inline';
        const code = document.createElement('code');
        code.style.background = '#f4f4f4';
        code.style.color = '#111';
        code.style.padding = '2px 6px';
        code.style.borderRadius = '4px';
        code.style.fontFamily = 'monospace';
        currentContainer.appendChild(code);
        activeNode = code;
      }
      continue;
    }

    if (mode !== 'normal') {
      appendText(ch);
      continue;
    }

    /* ---------- HEADINGS ---------- */
    if (lineStart && ch === '#') {
      headingCount++;
      continue;
    }

    if (headingCount > 0 && ch === ' ') {
      const h =
        headingCount === 1
          ? document.createElement('h1')
          : headingCount === 2
          ? document.createElement('h2')
          : document.createElement('h3');

      currentContainer.appendChild(h);
      activeNode = h;
      headingCount = 0;
      lineStart = false;
      continue;
    }

    /* ---------- BOLD / ITALIC ---------- */
    if (ch === '*') {
      starCount++;

      if (starCount === 2) {
        const strong = document.createElement('strong');
        currentContainer.appendChild(strong);
        activeNode = strong;
        starCount = 0;
        continue;
      }

      italicOpen = !italicOpen;
      const em = document.createElement('em');
      currentContainer.appendChild(em);
      activeNode = em;
      continue;
    } else {
      starCount = 0;
    }

    /* ---------- NEWLINE ---------- */
    if (ch === '\n') {
      lineStart = true;
      activeNode = null;
      appendText('\n');
      continue;
    }

    lineStart = false;
    appendText(ch);
  }
}

/* ============================
   DOM APPENDER
============================ */
function appendText(text: string) {
  if (!currentContainer) return;

  if (!activeNode) {
    const span = document.createElement('span');
    currentContainer.appendChild(span);
    activeNode = span;
  }

  activeNode.textContent += text;
}
