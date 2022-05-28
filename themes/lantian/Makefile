.PHONY: all markdown webpack

all: markdown webpack

favicon:
	$(MAKE) -C favicon

markdown:
	$(MAKE) -C lib/markdown

webpack: clean
	@node ../../node_modules/webpack-cli/bin/cli.js -c ./webpack/webpack.config.js

clean:
	@rm -rf source/assets
