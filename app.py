"""Flask transport skeleton. Routes deliberately contain no business logic."""
from flask import Flask, jsonify, request
from setsafe import authentication, contracts, materials, permissions, presentation

# Each route is mapped to exactly one business-module public entry point.
ROUTE_CONTRACTS = {
    "POST /api/projects/<project_id>/contracts/<contract_id>/distributions": contracts.distribute_contract,
    "POST /api/contracts/<contract_id>/signatures": contracts.sign_contract,
    "GET /api/projects/<project_id>/scripts/<script_id>": materials.view_script,
    "GET /api/projects/<project_id>/videos/<video_id>": materials.view_choreography,
    "PUT /api/projects/<project_id>/scripts/<script_id>": materials.update_script,
    "POST /api/projects/<project_id>/permissions": permissions.assign_view_permission,
}

def create_app() -> Flask:
    app = Flask(__name__)

    def not_implemented(operation: str):
        return jsonify({"error": "not_implemented", "message": f"{operation} is not implemented"}), 501

    def current_user() -> str:
        return authentication.identify_user(request.headers.get("X-User-ID", ""))

    def respond(operation, *args):
        """Call one business function; map PermissionError to 403 (DQ-3)."""
        try:
            result = operation(*args)
        except PermissionError:
            return jsonify({"error": "forbidden"}), 403
        return jsonify(presentation.present_result(result)), 200

    @app.post('/api/projects/<project_id>/contracts/<contract_id>/distributions')
    def distribute(project_id: str, contract_id: str):
        return not_implemented('distribute_contract')

    @app.post('/api/contracts/<contract_id>/signatures')
    def sign(contract_id: str):
        return not_implemented('sign_contract')

    @app.get('/api/projects/<project_id>/scripts/<script_id>')
    def script(project_id: str, script_id: str):
        return respond(materials.view_script, current_user(), project_id, script_id)

    @app.get('/api/projects/<project_id>/videos/<video_id>')
    def video(project_id: str, video_id: str):
        return not_implemented('view_choreography')

    @app.put('/api/projects/<project_id>/scripts/<script_id>')
    def edit_script(project_id: str, script_id: str):
        return not_implemented('update_script')

    @app.post('/api/projects/<project_id>/permissions')
    def grant_permission(project_id: str):
        return not_implemented('assign_view_permission')

    return app

app = create_app()
if __name__ == '__main__':
    app.run(debug=True)
