
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/C Z/Desktop/project-name/client/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove type annotations in function parameters and variable declarations
    // Matches: e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover', etc.
    content = content.replace(/:\s*React\.[A-Za-z]+(?:<[^>]*>)?/g, '');
    content = content.replace(/:\s*['"][^'"]*['"](?:\s*\|\s*['"][^'"]*['"])*/g, '');
    content = content.replace(/:\s*(?:Socket|User|AuthContextType|ThemeContextType|Theme|any|string|number|boolean|object|null|undefined)(?:\s*\|\s*(?:any|string|number|boolean|object|null|undefined|Socket|User|AuthContextType|ThemeContextType|Theme))*/g, '');

    // Remove interface and type definitions
    content = content.replace(/interface\s+\w+\s+\{[^}]*\}/g, '');
    content = content.replace(/type\s+\w+\s+=\s+[^;]*;/g, '');
    
    // Remove generic parameters like useState<any[]>([])
    content = content.replace(/<[^>]+>(?=\()/g, '');
    
    // Remove type assertions like as any, as string
    content = content.replace(/\s+as\s+\w+/g, '');
    
    // Remove non-null assertions
    content = content.replace(/!\./g, '.');
    content = content.replace(/!\(/g, '(');

    // Fix Destructuring types
    content = content.replace(/\{([^}]+)\}:\s*\{[^}]+\}/g, '{$1}');

    fs.writeFileSync(file, content);
});

console.log('Advanced cleanup complete');
