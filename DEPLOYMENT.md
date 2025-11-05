# GitHub Pages Deployment Guide

This guide will walk you through deploying your Quiz App to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your computer
- Node.js and npm installed

## Step 1: Install Dependencies

First, install the `gh-pages` package that we've added to your project:

```bash
npm install
```

## Step 2: Update Repository Name (if needed)

**Important**: If your GitHub repository is NOT named `quiz`, you need to update the base path.

1. Open `package.json`
2. Find the line: `"build:gh-pages": "tsc && vite build --base=/quiz/"`
3. Replace `quiz` with your actual repository name
4. For example, if your repo is `my-quiz-app`, change it to: `"build:gh-pages": "tsc && vite build --base=/my-quiz-app/"`

## Step 3: Initialize Git Repository (if not already done)

If your project isn't already a git repository:

```bash
git init
git add .
git commit -m "Initial commit"
```

## Step 4: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right, then select **New repository**
3. Name your repository (e.g., `quiz` - or choose your own name)
4. Choose **Public** (required for free GitHub Pages)
5. **DO NOT** initialize with README, .gitignore, or license (if your project already has these)
6. Click **Create repository**

## Step 5: Connect Local Repository to GitHub

Your repository URL is: `https://github.com/rasmiasdev123/quiz`

Run these commands:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/rasmiasdev123/quiz.git

# If you already have commits, push them
git branch -M main
git push -u origin main
```

**Note**: If you already have a remote named `origin`, you can either:
- Remove it first: `git remote remove origin`
- Or use a different name: `git remote add github https://github.com/rasmiasdev123/quiz.git`

## Step 6: Update Base Path in package.json

**Before deploying**, make sure the base path in `package.json` matches your repository name:

- If your repo is `quiz`: already set correctly
- If your repo has a different name: update the `build:gh-pages` script as mentioned in Step 2

## Step 7: Deploy to GitHub Pages

Run the deployment command:

```bash
npm run deploy
```

This command will:
1. Build your app with the correct base path for GitHub Pages
2. Deploy the `dist` folder to the `gh-pages` branch

**Important**: After running this command, the `gh-pages` branch will be created. This may take 1-2 minutes.

## Step 8: Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/rasmiasdev123/quiz
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
5. Click **Save**

**Note**: The `gh-pages` branch will only appear after you run `npm run deploy` (Step 7). If you don't see it, wait a minute and refresh the page.

## Step 9: Access Your Site

Your site will be available at:
```
https://rasmiasdev123.github.io/quiz/
```

**Note**: It may take a few minutes for the site to be available after the first deployment.

## Updating Your Site

Every time you make changes and want to deploy:

```bash
# Make your changes, then:
git add .
git commit -m "Your commit message"
git push

# Deploy to GitHub Pages
npm run deploy
```

## Troubleshooting

### Issue: `gh-pages` branch not showing in GitHub Pages settings

**Solution**: You must run `npm run deploy` first to create the `gh-pages` branch. After deployment, wait 1-2 minutes and refresh the GitHub Pages settings page.

### Issue: 404 errors or blank page

**Solution**: Make sure the base path in `package.json` matches your repository name exactly.

### Issue: Assets not loading

**Solution**: The base path might be incorrect. Check:
1. Repository name on GitHub
2. Base path in `package.json` `build:gh-pages` script
3. Rebuild and redeploy

### Issue: Routes not working (direct URL access)

GitHub Pages doesn't support client-side routing out of the box. For SPA (Single Page Applications), GitHub Pages will redirect all routes to `index.html`, which should work. If you still have issues:

1. Check that `basename` is set in `App.tsx` (already configured)
2. Verify the base path matches your repository name

### Issue: Environment variables not working

GitHub Pages serves static files, so environment variables need to be set at build time. Your Appwrite configuration should use `VITE_` prefixed variables that are embedded during build.

Make sure your `.env` file has the correct values and they're committed (or use GitHub Secrets if you prefer).

### Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file in the `public` folder with your domain name
2. Update your DNS settings
3. Update the base path in `package.json` to `/` instead of `/repo-name/`
4. Rebuild and redeploy

## Alternative: Manual Deployment

If you prefer to deploy manually:

```bash
# Build for GitHub Pages
npm run build:gh-pages

# Or for custom base path
VITE_BASE_PATH=/your-repo-name/ npm run build

# Then manually push the dist folder to gh-pages branch
```

## Quick Reference

- **Local Development**: `npm run dev`
- **Build for Production**: `npm run build`
- **Build for GitHub Pages**: `npm run build:gh-pages`
- **Deploy**: `npm run deploy`
- **Preview Build**: `npm run preview`

---

**Need Help?** Check the [GitHub Pages Documentation](https://docs.github.com/en/pages) or [Vite Deployment Guide](https://vite.dev/guide/static-deploy.html#github-pages).
