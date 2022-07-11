import * as functions from "firebase-functions";
import {Readable} from "stream";
import * as http from "http";
import {RequestOptions} from "http";

export const vplan =
    functions
        .region("europe-west1")
        .https
        .onRequest((request, response) => {
          const url = "http://geschuetzt.bszet.de/s-lk-vw/Vertretungsplaene/vertretungsplan-bgy.pdf";
          const auth = Buffer.from("bsz-et-2021:it-system#20").toString("base64");

          const options: RequestOptions = {
            headers: {
              "Authorization": "Basic " + auth,
            },
          };

          const req = http.get(url, options, (res) => {
            const chunks: Array<Uint8Array> = [];
            res.on("data", (chunk) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const buffer = Buffer.concat(chunks);
              const stream = new Readable();
              stream.push(buffer);
              stream.push(null);
              response.set({
                "Content-Type": "application/pdf",
                "Content-Length": buffer.length,
              });
              stream.pipe(response);
            });
          });
          req.on("error", (err) => {
            functions.logger.error(err, {structuredData: true});
          });
        });
