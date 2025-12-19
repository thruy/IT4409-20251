require("dotenv").config({ quiet: true });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
//middleware
app.use(cors());
app.use(express.json());

//ket noi database
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => { console.log("Connected to MongoDB"); })
    .catch((err) => { console.error("Error connecting to MongoDB:", err); });

//tao schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tên không được để trống"],
        minlength: [2, "Tên phải có ít nhất 2 ký tự"],
    },
    age: {
        type: Number,
        required: [true, "Tuổi không được để trống"],
        min: [0, "Tuổi phải >= 0"],
    },
    email: {
        type: String,
        required: [true, "Email không được để trống"],
        match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
        unique: true,
    },
    address: {
        type: String,
    },
});

const User = mongoose.model("User", UserSchema);

//todo API endpoints
app.get("/api/users", async (req, res) => {
    try {
        // Lấy query params với giới hạn
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";

        // Giới hạn page và limit
        page = Math.max(1, page); // page >= 1
        limit = Math.min(Math.max(1, limit), 100); // 1 <= limit <= 100

        // Tạo query filter cho search
        const filter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { address: { $regex: search, $options: "i" } },
                ],
            }
            : {};
        // Tính skip
        const skip = (page - 1) * limit;

        // Sử dụng Promise.all cho truy vấn song song
        const [users, total] = await Promise.all([
            User.find(filter).skip(skip).limit(limit),
            User.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit);
        // Trả về response
        res.json({
            page,
            limit,
            total,
            totalPages,
            data: users,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//post
app.post("/api/users", async (req, res) => {
    try {
        let { name, age, email, address } = req.body;

        // Chuẩn hóa dữ liệu đầu vào
        name = name?.trim();
        email = email?.trim()?.toLowerCase();
        address = address?.trim();
        age = parseInt(age); // Đảm bảo age là số nguyên

        // Tạo user mới
        const newUser = await User.create({ name, age, email, address });
        res.status(201).json({
            message: "Tạo người dùng thành công",
            data: newUser,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//put
app.put("/api/users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID không hợp lệ" });
        }

        let { name, age, email, address } = req.body;

        // Tạo object cập nhật chỉ với các trường được truyền vào
        const updateData = {};

        if (name !== undefined) {
            updateData.name = name.trim();
        }
        if (age !== undefined) {
            updateData.age = parseInt(age); // Đảm bảo age là số nguyên
        }
        if (email !== undefined) {
            updateData.email = email.trim().toLowerCase();
        }
        if (address !== undefined) {
            updateData.address = address.trim();
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true } // Quan trọng
        );
        if (!updatedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.json({
            message: "Cập nhật người dùng thành công",
            data: updatedUser,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//delete
app.delete("/api/users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra ID hợp lệ trước khi xóa
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID không hợp lệ" });
        }

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.json({ message: "Xóa người dùng thành công" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
//start server
app.listen(PORT, () => { console.log("Server is running on http://localhost:3000"); });