.PHONY: all deps public webpack verify
all: deps webpack public verify

deps:
	@npm install

webpack: deps
	$(MAKE) -C themes/lantian webpack

public: deps webpack
	@node node_modules/hexo/bin/hexo generate 2>&1 | tee hexo.log

verify: deps public
	[ -s "public/index.html" ] || exit 1
	[ -s "public/assets/script.main.bundle.js" ] || exit 1
	node node_modules/acorn/bin/acorn --ecma2020 --silent public/assets/script.main.bundle.js || exit 1

clean: deps
	@node node_modules/hexo/bin/hexo clean
	$(MAKE) -C themes/lantian clean

serve:
	@python3 -m http.server --directory public/
