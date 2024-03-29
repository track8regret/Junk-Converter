DOCKER_REGISTRY=registry.pissvial.com

PACKAGE_VERSION := $(shell jq -r ".version" < package.json)
IMAGE_NAME := $(shell jq -r ".name" < package.json | sed 's/@//g')

IMAGE_TAG := $(DOCKER_REGISTRY)/$(IMAGE_NAME)
IMAGE_TAG_VERSION := $(IMAGE_TAG):$(PACKAGE_VERSION)
IMAGE_TAG_LATEST  := $(IMAGE_TAG):latest

info:
	@echo IMAGE NAME IS $(IMAGE_NAME)
	@echo VERSION IS $(PACKAGE_VERSION)
clean:
	rm -rf build/
build:
	docker build -t $(IMAGE_TAG_VERSION) -t $(IMAGE_TAG_LATEST) .
publish:
	docker push $(IMAGE_TAG) --all-tags

all: info build publish clean