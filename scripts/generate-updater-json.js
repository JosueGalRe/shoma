const { Octokit } = require('@octokit/rest');

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const tag = process.env.GITHUB_REF_NAME;

  const octokit = new Octokit({ auth: token });

  const { data: release } = await octokit.rest.repos.getReleaseByTag({
    owner,
    repo,
    tag,
  });

  const macosDmg = release.assets.find(a => a.name.endsWith('_aarch64.dmg'));
  const windowsExe = release.assets.find(a => a.name.endsWith('_x64-setup.exe'));
  const macosSig = release.assets.find(a => a.name.endsWith('_aarch64.dmg.sig'));
  const windowsSig = release.assets.find(a => a.name.endsWith('_x64-setup.exe.sig'));

  if (!macosDmg || !windowsExe) {
    throw new Error('Required release assets not found');
  }

  const fetchSig = async (asset) => {
    if (!asset) return '';
    const response = await fetch(asset.browser_download_url, {
      headers: { Authorization: `token ${token}` },
    });
    return response.text();
  };

  const [macosSigContent, windowsSigContent] = await Promise.all([
    fetchSig(macosSig),
    fetchSig(windowsSig),
  ]);

  const updaterJson = {
    version: tag.replace('conduit-v', ''),
    notes: release.body,
    pub_date: release.published_at,
    platforms: {},
  };

  if (macosSigContent) {
    updaterJson.platforms['darwin-aarch64'] = {
      signature: macosSigContent.trim(),
      url: macosDmg.browser_download_url,
    };
  }

  if (windowsSigContent) {
    updaterJson.platforms['windows-x86_64'] = {
      signature: windowsSigContent.trim(),
      url: windowsExe.browser_download_url,
    };
    updaterJson.platforms['windows-x86_64-nsis'] = {
      signature: windowsSigContent.trim(),
      url: windowsExe.browser_download_url,
    };
  }

  const fs = require('fs');
  fs.writeFileSync('latest.json', JSON.stringify(updaterJson, null, 2));
  console.log('Generated latest.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
