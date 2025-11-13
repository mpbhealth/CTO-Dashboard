# Node Version Fix - Netlify Build Error

## ❌ The Problem

**Error:** `crypto.hash is not a function`

**Root Cause:** Netlify was using Node.js 18.20.8, but Vite 7.x requires Node.js 20.19+ or 22.12+

**Build Log Error:**
```
You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+. 
Please upgrade your Node.js version.

error during build:
[vite:build-html] crypto.hash is not a function
```

## ✅ The Fix

Set Node.js version to 20 using TWO methods (for redundancy):

### 1. `.nvmrc` File (Created)
```
20
```

### 2. `netlify.toml` Configuration (Updated)
```toml
[build.environment]
  NODE_VERSION = "20"
```

## 🚀 Deploy Now

```bash
# Commit the fix
git add .
git commit -m "fix: set node version to 20 for vite compatibility"
git push

# Netlify will auto-deploy with Node 20
```

## ✅ How to Verify

After the build runs, check the build logs for:
```
Using Node.js version 20.x.x
```

The build should now succeed! 🎉

## 📚 Why Two Methods?

1. **`.nvmrc`** - Standard Node version file recognized by nvm, Netlify, and other tools
2. **`netlify.toml`** - Netlify-specific configuration as backup

Using both ensures maximum compatibility.

## 🔗 References

- [Netlify Node.js Docs](https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-and-javascript)
- [Vite Node.js Requirements](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)

