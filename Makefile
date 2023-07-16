.PHONY: all deps public theme verify
all: deps theme public verify

deps:
	@npm install

theme: deps
	$(MAKE) -C themes/lantian

public:
	@node node_modules/hexo/bin/hexo generate 2>&1 | tee hexo.log
	@cp -r themes/lantian/favicon/generated/* public/

verify: deps public
	[ -s "public/index.html" ] || exit 1
	[ -z "$(find public/ -name \*.html -type f -size -1)" ] || exit 1
	[ -s "public/assets/script.main.bundle.js" ] || exit 1
	node node_modules/acorn/bin/acorn --ecma2020 --silent public/assets/script.main.bundle.js || exit 1

clean: deps
	@node node_modules/hexo/bin/hexo clean
	$(MAKE) -C themes/lantian clean

thumbs:
	@sh _scripts/thumbs.sh

serve:
	@python3 -m http.server 8080 --directory public/
