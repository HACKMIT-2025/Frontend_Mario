# Build Check System

## Overview
This repository has an automated build check system that ensures code compiles successfully before pushing to the remote repository.

## Components

### 1. Pre-push Hook (`.git/hooks/pre-push`)
- **Automatically runs** before every `git push`
- Checks if the TypeScript code compiles without errors
- Prevents pushing broken code to the repository
- Location: `.git/hooks/pre-push`

### 2. Manual Build Check Script (`check-build.sh`)
- Run manually to test build before committing
- Usage: `./check-build.sh`
- Useful for checking build status during development

## How It Works

When you run `git push`, the pre-push hook will:
1. Navigate to the `mario-game` directory
2. Install dependencies if needed
3. Run `npm run build` (TypeScript compilation + Vite build)
4. If build fails, the push is aborted
5. If build succeeds, the push continues

## Manual Testing

To manually check if your code builds:
```bash
./check-build.sh
```

Or directly:
```bash
cd mario-game && npm run build
```

## Bypassing the Hook (Emergency Only)

If you absolutely need to push without the build check:
```bash
git push --no-verify
```
⚠️ **Warning**: Only use this in emergencies. Pushing broken code can break the deployment.

## Troubleshooting

### Build fails with TypeScript errors
- Fix the TypeScript errors shown in the console
- Common issues:
  - Unused variables (remove or prefix with `_`)
  - Type mismatches
  - Missing imports

### Dependencies not installed
The hook automatically installs dependencies, but you can manually run:
```bash
cd mario-game && npm install
```

### Hook not running
Ensure the hook is executable:
```bash
chmod +x .git/hooks/pre-push
```

## Benefits

✅ **Prevents broken deployments** - No broken code in main branch  
✅ **Early error detection** - Catch issues before they reach the repository  
✅ **Team confidence** - Everyone knows the main branch always builds  
✅ **CI/CD compatibility** - Ensures deployments won't fail due to build errors  

## Development Workflow

1. Make your changes
2. Test locally: `cd mario-game && npm run dev`
3. Check build: `./check-build.sh`
4. Commit your changes: `git commit -m "your message"`
5. Push (build check runs automatically): `git push`

## Disabling the Hook

To temporarily disable the hook:
```bash
mv .git/hooks/pre-push .git/hooks/pre-push.disabled
```

To re-enable:
```bash
mv .git/hooks/pre-push.disabled .git/hooks/pre-push
```