import * as functions from "firebase-functions";
import {Readable} from "stream";
import * as http from "http";
import {RequestOptions} from "http";

export const vplan =
    functions
        .region("europe-west1")
        .https
        .onRequest((request, response) => {
            let baseUrl = "http://geschuetzt.bszet.de/s-lk-vw/Vertretungsplaene/V_PlanBGy/";
            const auth = Buffer.from("bsz-et-2223:sommer#22").toString("base64");

            const options: RequestOptions = {
                headers: {
                    "Authorization": "Basic " + auth,
                },
            };

            if (request.query.target == undefined) {
                baseUrl += 'index.html';
            } else {
                baseUrl += request.query.target;
            }

            const req = http.get(baseUrl, options, (res) => {
                const chunks: Array<Uint8Array> = [];
                res.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                res.on("end", () => {
                    const buffer = Buffer.concat(chunks);
                    let text = new TextDecoder().decode(buffer);
                    const appUrl = `http://${request.header('host')}/${process.env.GCLOUD_PROJECT}/europe-west1/${process.env.FUNCTION_TARGET}`;
                    const regexMatch = text.match(/V_DC_00[1-9]\.html|index\.html/g);
                    regexMatch?.map((item) => {
                        text = text.replace(item, `${appUrl}?target=${item}`);
                    });
                    const newBuffer = Buffer.from(text, "utf-8");
                    const stream = new Readable();
                    stream.push(newBuffer);
                    stream.push(null);
                    response.set({
                        "Content-Type": "text/html; charset=utf-8",
                    });
                    stream.pipe(response);
                });
            });

            req.on("error", (err) => {
                functions.logger.error(err, {structuredData: true});
            });
        });
