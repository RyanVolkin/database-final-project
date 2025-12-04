require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

console.log(`Server is starting on port: ${port}`);
console.log(process.env.DB_USER)

app.use(express.json()); // Enable JSON body parsing
// Enable CORS for development. This adds the Access-Control-Allow-Origin header
// so your client (e.g. http://localhost:5173) can call this API.
app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
app.get('/api/highschools', async (req, res) => {
    try {
        const sql = `SELECT irn, name FROM Building WHERE level = 'High' ORDER BY name`;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/district', async (req, res) => {
    try {
        const q = req.query || {};
        const where = [];
        const params = [];
        let idx = 1;

        if (q.name) {
            where.push(`LOWER(d.name) LIKE '%' || LOWER($${idx}) || '%'`);
            params.push(String(q.name));
            idx++;
        }

        const numericMap = {
            perfindexscore_min: 'da.perfindexscore >=',
            perfindexscore_max: 'da.perfindexscore <=',
            studentsproficient_min: 'da.studentsproficient >=',
            studentsproficient_max: 'da.studentsproficient <=',
            studentsadvanced_min: 'da.studentsadvanced >=',
            studentsadvanced_max: 'da.studentsadvanced <=',
            studentsadvancedplus_min: 'da.studentsadvancedplus >=',
            studentsadvancedplus_max: 'da.studentsadvancedplus <=',
            studentslimited_min: 'da.studentslimited >=',
            studentslimited_max: 'da.studentslimited <=',
            studentsbasic_min: 'da.studentsbasic >=',
            studentsbasic_max: 'da.studentsbasic <=',
            studentsaccomplished_min: 'da.studentsaccomplished >=',
            studentsaccomplished_max: 'da.studentsaccomplished <=',
        };

        for (const key of Object.keys(numericMap)) {
            if (q[key] !== undefined && q[key] !== null && q[key] !== '') {
                where.push(`${numericMap[key]} $${idx}`);
                params.push(Number(q[key]));
                idx++;
            }
        }

        const having = [];
        if (q.schoolcount_min !== undefined && q.schoolcount_min !== null && q.schoolcount_min !== '') {
            having.push(`COUNT(bt.districtirn) >= $${idx}`);
            params.push(Number(q.schoolcount_min));
            idx++;
        }
        if (q.schoolcount_max !== undefined && q.schoolcount_max !== null && q.schoolcount_max !== '') {
            having.push(`COUNT(bt.districtirn) <= $${idx}`);
            params.push(Number(q.schoolcount_max));
            idx++;
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const havingClause = having.length ? `HAVING ${having.join(' AND ')}` : '';

        const sql = `SELECT
                            d.irn AS irn,
                            d.name AS name,
                            da.perfindexscore AS perfindexscore,
                            da.studentslimited AS studentslimited,
                            da.studentsbasic AS studentsbasic,
                            da.studentsproficient AS studentsproficient,
                            da.studentsaccomplished AS studentsaccomplished,
                            da.studentsadvanced AS studentsadvanced,
                            da.studentsadvancedplus AS studentsadvancedplus,
                            COUNT(bt.districtirn) AS schoolcount
                     FROM District d
                     LEFT JOIN BelongsTo bt ON d.irn = bt.districtirn
                     LEFT JOIN DistrictAchievement da ON d.irn = da.irn
                     ${whereClause}
                     GROUP BY d.irn, d.name, da.perfindexscore, da.studentslimited, da.studentsbasic, da.studentsproficient, da.studentsaccomplished, da.studentsadvanced, da.studentsadvancedplus
                     ${havingClause}`;
        const result = await pool.query(sql, params);
        res.json(result.rows);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/schools', async (req, res) => {
    try {
        const q = req.query || {};
        const where = [];
        const params = [];
        let idx = 1;

        if (q.name) {
            where.push(`LOWER(b.name) LIKE '%' || LOWER($${idx}) || '%'`);
            params.push(String(q.name));
            idx++;
        }

        const numericMap = {
            enrollment_min: 'b.enrollment >=',
            enrollment_max: 'b.enrollment <=',
            attendancerate_min: 'b.attendancerate >=',
            attendancerate_max: 'b.attendancerate <=',
            mobilityrate_min: 'b.mobilityrate >=',
            mobilityrate_max: 'b.mobilityrate <=',
            chronicabsenteeismrate_min: 'b.chronicabsenteeismrate >=',
            chronicabsenteeismrate_max: 'b.chronicabsenteeismrate <=',
            perfindexscore_min: 'ba.perfindexscore >=',
            perfindexscore_max: 'ba.perfindexscore <=',
            studentsproficient_min: 'ba.studentsproficient >=',
            studentsproficient_max: 'ba.studentsproficient <=',
            studentsadvanced_min: 'ba.studentsadvanced >=',
            studentsadvanced_max: 'ba.studentsadvanced <=',
            studentsadvancedplus_min: 'ba.studentsadvancedplus >=',
            studentsadvancedplus_max: 'ba.studentsadvancedplus <=',
            studentslimited_min: 'ba.studentslimited >=',
            studentslimited_max: 'ba.studentslimited <=',
            studentsbasic_min: 'ba.studentsbasic >=',
            studentsbasic_max: 'ba.studentsbasic <=',
            studentsaccomplished_min: 'ba.studentsaccomplished >=',
            studentsaccomplished_max: 'ba.studentsaccomplished <=',
        };

        for (const key of Object.keys(numericMap)) {
            if (q[key] !== undefined) {
                where.push(`${numericMap[key]} $${idx}`);
                params.push(Number(q[key]));
                idx++;
            }
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        console.log(whereClause);
        const sql = `SELECT b.irn AS irn,
                            b.name AS name,
                            b.enrollment,
                            b.attendancerate AS attendancerate,
                            b.mobilityrate AS mobilityrate,
                            b.chronicabsenteeismrate AS chronicabsenteeismrate,
                            ba.perfindexscore AS perfindexscore,
                            ba.studentslimited AS studentslimited,
                            ba.studentsbasic AS studentsbasic,
                            ba.studentsproficient AS studentsproficient,
                            ba.studentsaccomplished AS studentsaccomplished,
                            ba.studentsadvanced AS studentsadvanced,
                            ba.studentsadvancedplus AS studentsadvancedplus
                     FROM Building b
                     LEFT JOIN BuildingAchievement ba ON b.irn = ba.irn
                     ${whereClause}`;
        console.log(sql);

        const result = await pool.query(sql, params);
        res.json(result.rows);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

    app.get('/api/highschoolachievement', async (req, res) => {
        try {
            const q = req.query || {};
            const where = [];
            const params = [];
            let idx = 1;

            if (q.name) {
                where.push(`LOWER(b.name) LIKE '%' || LOWER($${idx}) || '%'`);
                params.push(String(q.name));
                idx++;
            }

            const numericMap = {
                pathcompleted_min: 'h.pathcompletedpc >=',
                pathcompleted_max: 'h.pathcompletedpc <=',
                satsatisfactory_min: 'h.satsatisfactorypc >=',
                satsatisfactory_max: 'h.satsatisfactorypc <=',
                honordiploma_min: 'h.honordiplomapc >=',
                honordiploma_max: 'h.honordiplomapc <=',
                apiboutstanding_min: 'h.apiboutstandingpc >=',
                apiboutstanding_max: 'h.apiboutstandingpc <=',
                careerready_min: 'h.careerreadypc >=',
                careerready_max: 'h.careerreadypc <=',
                dualready_min: 'h.dualreadypc >=',
                dualready_max: 'h.dualreadypc <=',
                militaryenlisted_min: 'h.militaryenlistedpc >=',
                militaryenlisted_max: 'h.militaryenlistedpc <=',
                techproficiency_min: 'h.techproficiencypc >=',
                techproficiency_max: 'h.techproficiencypc <=',
                wblcompletion_min: 'h.wblcompletionpc >=',
                wblcompletion_max: 'h.wblcompletionpc <=',
                fouryeargradrate_min: 'h.fouryeargradrate >=',
                fouryeargradrate_max: 'h.fouryeargradrate <='
            };

            for (const key of Object.keys(numericMap)) {
                if (q[key] !== undefined && q[key] !== null && q[key] !== '') {
                    where.push(`${numericMap[key]} $${idx}`);
                    params.push(Number(q[key]));
                    idx++;
                }
            }

            const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

            const sql = `SELECT
                                h.irn AS irn,
                                b.name AS name,
                                h.pathcompletedpc AS pathcompletedpc,
                                h.satsatisfactorypc AS satsatisfactorypc,
                                h.honordiplomapc AS honordiplomapc,
                                h.apiboutstandingpc AS apiboutstandingpc,
                                h.careerreadypc AS careerreadypc,
                                h.dualreadypc AS dualreadypc,
                                h.militaryenlistedpc AS militaryenlistedpc,
                                h.techproficiencypc AS techproficiencypc,
                                h.wblcompletionpc AS wblcompletionpc,
                                h.fouryeargradrate AS fouryeargradrate
                         FROM HighSchoolAchievement h
                         LEFT JOIN Building b ON h.irn = b.irn
                         ${whereClause}`;

            const result = await pool.query(sql, params);
            res.json(result.rows);

        } catch (err) {
            console.log(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});