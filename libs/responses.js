/**
 * Declarar variable y formatear respuesta.
 */
const Responses = {
    _DefineResponse(statusCode = 502, data = {}) {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            statusCode,
            body: JSON.stringify(data),
        };
    },
    _200(data = {}) {
        return this._DefineResponse(200, data);
    },
    _203(data = {}) {
        return this._DefineResponse(200, data);
    },
    _204(data = {}) {
        return this._DefineResponse(204, data);
    },
    _400(data = {}) {
        return this._DefineResponse(400, data);
    },
    _401(data = {}) {
        return this._DefineResponse(400, data);
    },
    _402(data = {}) {
        return this._DefineResponse(400, data);
    },
    _403(data = {}) {
        return this._DefineResponse(400, data);
    },
    _404(data = {}) {
        return this._DefineResponse(404, data);
    },
    _500(data = {}) {
        return this._DefineResponse(500, data);
    },
    _501(data = {}) {
        return this._DefineResponse(500, data);
    },
    _502(data = {}) {
        return this._DefineResponse(500, data);
    },
};

/**
 * Esportar variable de respuesta.
 */
module.exports = {
    Responses
}