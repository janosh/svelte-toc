# Contributing

## 🙋 How can I help?

Pull requests to improve docs, test coverage or examples are always welcome! If you want to implement a new feature, please submit an issue first so we can discuss project-fit. You can also look for [issues labeled 'help wanted'](https://github.com/janosh/svelte-toc/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) and open a PR to close one of those. If you don't finish, you're welcome to submit it as draft PR anyway. Someone else might take over.

## 🚀 Submit a PR

To submit a pull request, clone the repo, install dependencies and start the dev server to see changes as you make them.

```sh
git clone https://github.com/janosh/svelte-toc
cd svelte-toc
npm install
npx vp dev
```

Before you start committing, create and check out a descriptively named branch:

```sh
git checkout -b my-cool-new-feature
# or
git checkout -b docs-on-something
# or
git checkout -b test-some-feature
```

To ensure your changes didn't break anything, run the same checks that run in CI:

```sh
npx vp check
npm run test
```

Any new features should come with corresponding tests. If you fix a bug, please add a test that fails under the old code and passes with your changes. If you're having trouble writing tests, you can submit your PR anyway. Others might be able to help with tests but chances are your code will take longer to get merged.

## ✅ CI checks

This repo has 3 required CI checks that have to pass for every PR before merging:

- tests: [`npm run test`](https://github.com/janosh/svelte-toc/actions/workflows/test.yml)
- linting/type checking: [`npx vp check`](https://github.com/janosh/svelte-toc/actions/workflows/lint.yml)
- docs: [`npx vp build`](https://github.com/janosh/svelte-toc/actions/workflows/gh-pages.yml) and GitHub Pages deployment

## 🆕 New release

To make a release, increase the `"version"` field in `package.json`. This package follows semantic versioning, meaning

- `v[x.y.z] -> v[x+1.y.z]`: major release with breaking changes
- `v[x.y.z] -> v[x.y+1.z]`: minor release with new features
- `v[x.y.z] -> v[x.y.z+1]`: patch release with bug fixes

Now run the `changelog` script from `package.json` to update `changelog.md`.

```sh
npm run changelog
```

Before committing, run the CI checks above. Then commit the release files to the `main` branch using the new version number prefixed by `v` as commit message and tag:

```sh
git add package.json changelog.md
git commit -m vx.y.z
git tag $(git log -1 --pretty=%B)
```

Push the release commit and tag to `origin/main`:

```sh
git push && git push --tags
```

Finally [publish a new release on GitHub](https://github.com/janosh/svelte-toc/releases/new).
