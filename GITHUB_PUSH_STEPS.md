# Push This Money Folder To GitHub

Repo name: `philip-builds`

Run these in Terminal on your Mac.

## 1. Go To The Folder

```bash
cd /Users/philipmiranda/Documents/money
```

## 2. Check What Is In Git

```bash
git status
```

## 3. Create A GitHub Repo

Go to:

```text
https://github.com/new
```

Use:

```text
Repository name: philip-builds
Visibility: Public
```

Do not add a README on GitHub because this folder already has one.

## 4. Connect This Folder To GitHub

Replace `YOUR-GITHUB-USERNAME` with your GitHub username.

```bash
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/philip-builds.git
```

If it says `remote origin already exists`, run:

```bash
git remote -v
```

Then update it with:

```bash
git remote set-url origin https://github.com/YOUR-GITHUB-USERNAME/philip-builds.git
```

## 5. Save The Files In Git

```bash
git add .
git commit -m "Add starter business portfolio and demos"
```

## 6. Push To GitHub

```bash
git branch -M main
git push -u origin main
```

## 7. Turn On GitHub Pages

In GitHub:

1. Open the `philip-builds` repo.
2. Go to `Settings`.
3. Go to `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Branch: `main`.
6. Folder: `/root`.
7. Save.

Your portfolio page will be at:

```text
https://YOUR-GITHUB-USERNAME.github.io/philip-builds/portfolio/
```

Your demo will be at:

```text
https://YOUR-GITHUB-USERNAME.github.io/philip-builds/demos/shift-downtime-calculator/
```
