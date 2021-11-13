"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationAdmin = void 0;
const boot_1 = require("@loopback/boot");
const rest_explorer_1 = require("@loopback/rest-explorer");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const service_proxy_1 = require("@loopback/service-proxy");
const sequence_admin_1 = require("./sequence-admin");
class ApplicationAdmin extends boot_1.BootMixin(service_proxy_1.ServiceMixin(repository_1.RepositoryMixin(rest_1.RestApplication))) {
    constructor(options = {}) {
        super(options);
        // Set up the custom sequence
        this.sequence(sequence_admin_1.MyAdminSequence);
        // Set up default home page
        //this.static( '/', path.join( __dirname, '../dist-admin' ) );
        //this.static( '/css', path.join( __dirname, '../public/css' ) );
        // Customize @loopback/rest-explorer configuration here
        this.configure(rest_explorer_1.RestExplorerBindings.COMPONENT).to({
            //path: '/explorer',
            //swaggerThemeFile: '/css/swagger.css',
            useSelfHostedSpec: true,
            indexTemplatePath: '',
        });
        this.component(rest_explorer_1.RestExplorerComponent);
        this.projectRoot = __dirname;
        // Customize @loopback/boot Booter Conventions here
        this.bootOptions = {
            controllers: {
                // Customize ControllerBooter Conventions here
                dirs: ['controllers-admin'],
                extensions: ['.controller.js'],
                nested: true,
            },
        };
    }
}
exports.ApplicationAdmin = ApplicationAdmin;
//# sourceMappingURL=application-admin.js.map