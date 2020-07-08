const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const altConfigs = {};
const sysRoot = path.join(__dirname, '../../..');

/**
 * Get alternative theme config file by page language
 *
 * @param lang page language
 * @returns Object merged theme config
 */
hexo.extend.helper.register('theme_config', function(lang = null) {
    if (lang) {
        if (!altConfigs.hasOwnProperty(lang)) {
            const configPath = path.join(sysRoot, 'source/_data/theme_' + lang + '.yml');
            if (fs.existsSync(configPath)) {
                const config = yaml.safeLoad(fs.readFileSync(configPath));
                if (config != null) {
                    altConfigs[lang] = config;
                }
            }
        }
        if (altConfigs.hasOwnProperty(lang) && altConfigs[lang]) {
            return Object.assign({}, hexo.theme.config, altConfigs[lang]);
        }
    }
    return hexo.theme.config;
});
