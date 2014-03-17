var deps = [
    "common-ui/AngularPluginHandler",
    "common-ui/AngularPlugin",
    "common-ui/angular"
];

define(deps, function(AngularPluginHandler, AngularPlugin) {

    describe("Angular Plugin Handler", function() {

        var moduleName = "module";
        var pluginHandler, module, plugin;

        beforeEach(function(){
            pluginHandler = new AngularPluginHandler();
            plugin = new AngularPlugin({
                moduleName : moduleName,
                pluginHandler : pluginHandler,
                routerCallback : function($routeProvider) { $routeProvider.when("/test", {}); },
                controllerCallback : function($controllerProvider) { $controllerProvider("test", null); },
                serviceCallback : function($serviceProvider) { $serviceProvider("test", null); },
                factoryCallback : function($factoryProvider) { $factoryProvider("test", null); },
                filterCallback : function($filterProvider) { $filterProvider("test", null); },
                directiveCallback : function($directiveProvider) { $directiveProvider("test", null); }
            });

            module = pluginHandler.module(moduleName, []);

            spyOn(pluginHandler, "_onRegister").andCallThrough();
            spyOn(pluginHandler, "_onUnregister").andCallThrough();
        });

        it("should extend all of the Pentaho Plugin Handler functions", function() {
            expect(pluginHandler.register).toBeDefined();
            expect(pluginHandler.unregister).toBeDefined();
            expect(pluginHandler.unregisterById).toBeDefined();
            expect(pluginHandler.get).toBeDefined();
        })

        describe("pre-bootstrap tests", function() {
            var routeProvider;
            
            beforeEach(function(){
                spyOn(module, "controller");
                spyOn(module, "service");
                spyOn(module, "factory");
                spyOn(module, "filter");
                spyOn(module, "directive");

                module.config(["$routeProvider", function($routeProvider) {
                    routeProvider = $routeProvider;
                    spyOn($routeProvider, "when");
                }])
            });

            it("should define a module", function() {
                expect(module).toBeDefined();
                expect(module.name).toEqual(moduleName);            
            });

            it("should register a plugin and call the private onRegister function", function() {
                pluginHandler.register(plugin);
                expect(pluginHandler._onRegister).toHaveBeenCalled();
            });

            it("should unregister a plugin and call the private onUnregister function", function() {
                pluginHandler.register(plugin);
                pluginHandler.unregister(plugin);
                expect(pluginHandler._onUnregister).toHaveBeenCalled();

                angular.bootstrap(null, [moduleName]);

                // Should not be called since it got unregistered before bootrstrap occurred
                expect(routeProvider.when).not.toHaveBeenCalled();
            });

            it("should call all of the pre-bootstrap angular services after registering the plugin", function() {
                pluginHandler.register(plugin);

                expect(module.controller).toHaveBeenCalled();
                expect(module.service).toHaveBeenCalled();
                expect(module.factory).toHaveBeenCalled();
                expect(module.filter).toHaveBeenCalled();
                expect(module.directive).toHaveBeenCalled();

                // Bootstrap to call config binding in "beforeEach"
                angular.bootstrap(null, [moduleName]);
                expect(routeProvider.when).toHaveBeenCalled();
            });

            it("should throw an exception when trying to use the 'otherwise' property of the routing is used", function() {
                var plugin = new AngularPlugin({
                    moduleName : moduleName,
                    pluginHandler : pluginHandler,
                    routerCallback : function($routeProvider) {
                        $routeProvider
                            .otherwise();
                    }
                })

                expect(function(){
                    pluginHandler.register(plugin);
                }).toThrow(AngularPluginHandler.errMsgs.otherwiseNotAllowed);
            });

            it("should fail when registering a plugin that uses a module that was not made pluggable", function() {
                var moduleName = "test1";
                angular.module(moduleName, []);
                plugin.moduleName = moduleName;

                expect(function(){
                    pluginHandler.register(plugin);
                }).toThrow(AngularPluginHandler.errMsgs.moduleNotPluggable);
            })
        });

        describe("post-bootstrap tests", function() {

            beforeEach(function() {
                angular.bootstrap(null, [moduleName]);

                spyOn(module.$routeProvider, "when");
                spyOn(module.$controllerProvider, "register");
                spyOn(module.$provide, "service");
                spyOn(module.$provide, "factory");
                spyOn(module.$filterProvider, "register");
                spyOn(module.$compileProvider, "directive");
            })

            it("should have made the module pluggable", function() {
                expect(module.$routeProvider).toBeDefined();
                expect(module.$controllerProvider).toBeDefined();
                expect(module.$compileProvider).toBeDefined();
                expect(module.$filterProvider).toBeDefined();
                expect(module.$provide).toBeDefined();
                expect(module.$location).toBeDefined();
                expect(module.$rootScope).toBeDefined();
            });

            it("should call all of the post-bootstrap angular services after registering the plugin", function() {
                pluginHandler.register(plugin);

                expect(module.$routeProvider.when).toHaveBeenCalled();
                expect(module.$controllerProvider.register).toHaveBeenCalled();
                expect(module.$provide.service).toHaveBeenCalled();
                expect(module.$provide.factory).toHaveBeenCalled();
                expect(module.$filterProvider.register).toHaveBeenCalled();
                expect(module.$compileProvider.directive).toHaveBeenCalled();
            });

            it("should call all of the post-bootstrap angular services twice after registering then unregistering the plugin", function() {
                pluginHandler.register(plugin);
                pluginHandler.unregister(plugin);

                expect(module.$routeProvider.when.calls.length).toEqual(2);
                expect(module.$controllerProvider.register.calls.length).toEqual(2);
                expect(module.$provide.service.calls.length).toEqual(2);
                expect(module.$provide.factory.calls.length).toEqual(2);
                expect(module.$filterProvider.register.calls.length).toEqual(2);
                expect(module.$compileProvider.directive.calls.length).toEqual(2);
            });


            var path = "test";
            it("should goto a desired path", function() {
                pluginHandler.goto(path, moduleName);
                expect(module.$location.path()).toMatch(moduleName + '/' + path);
            })

            it("should perform the goto function from the rootscope", function() {
                module.$rootScope.goto(path, moduleName);
                expect(module.$location.path()).toMatch(moduleName + '/' + path);
            })

            it("should goHome goHome in the browser", function() {
                pluginHandler.goHome(moduleName);
                expect(module.$location.path()).toMatch('/');
            });

            it("should goHome goHome in the browser", function() {
                module.$rootScope.goHome(moduleName);
                expect(module.$location.path()).toMatch('/');
            });            
        });
    })
})