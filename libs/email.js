'use strict';
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path')

/**
 * Función que envía correos mediante un servidor smtp de Sendgrid.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.sendFromSendgrid = async () => {

    /**   ************* EN CONSTRUCCIÓN *************  */

    try {

        const URL1 = '';

        const msg = {
            from: process.env.MAIL_FROM,
            to: process.env.MAIL_TO,
            cc: '',
            subject: '',
            text: ``,
            html: ''
        };
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
        let resp = await sgMail.send(msg);

        return resp;

    } catch (error) {

        return error.response.body

    }

}

/**
 * Función que envía correos mediante un servidor smtp de Gmail.
 * @param {json} mailOpt: Objeto JSON que contiene los parámetros para configurar el mensaje y el template.
 * @param {json} hbsOpt: Objeto JSON que contiene las rutas donde se encuentra el template para formatear el email.
 * @return {json}: Respuesta JSON que retorna un mensaje con información de acción satisfactoria y resultado del envío, si falla retorna excepción.
 */
module.exports.sendFromGmail = async (mailOpt, hbsOpt) => {

    try {

        /** CONFIGURAR NODEMAILER CON SERVIDOR SMTP. */
        const transporter = nodemailer.createTransport({
            host: process.env.GMAIL_HOST,
            port: process.env.GMAIL_PORT,
            requireTLS: process.env.GMAIL_REQUIRETLS,
            auth: {
                user: process.env.GMAIL_AUTH_USER,
                pass: process.env.GMAIL_AUTH_PASSWORD
            }
        });

        /** CONFIGURAR PARÁMETROS DE HBS. */
        const HBS_OPTIONS = {
            viewEngine: {
              extName: ".hbs",
              partialsDir: path.resolve(__dirname, hbsOpt.partialsDir),
              defaultLayout: false
            },
            viewPath: path.resolve(__dirname, hbsOpt.viewPath),
            extName: ".hbs"
        };

        /** APLICAR CONFIGURACIÓN HBS A NODEMAILER. */
        transporter.use('compile', hbs(HBS_OPTIONS));

        /** CONFIGURAR PARÁMETROS DEL EMAIL. */
        const MAIL_OPTIONS = {
            from: mailOpt.from,
            to: mailOpt.to,
            subject: mailOpt.subject,
            template: mailOpt.template,
            cc: mailOpt.cc,
            bcc: mailOpt.bcc,
            attachments: mailOpt.attachments,
            context: mailOpt.context
        };

        /** ENVIAR EMAIL CON LA CONFIGURACIÓN CORRESPONDIENTE. */
        let result = await transporter.sendMail(MAIL_OPTIONS);

        /** RETORNO RESPUESTA. */
        return { message: 'Email enviado correctamente.', result }

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { error }

    }

};