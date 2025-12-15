import { CategoryValidationSchema, UpdateCategoryDetails } from "../schema/category.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { Category } from "../model/category.model"

const addCategory = asyncHandler(async (req, res) => {
    try {

        const { error, value } = CategoryValidationSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
        }

        const data = {
            user_id: req.user?._id,
            ...value
        }

        const user = await Category.create(data);

        return res.status(201).json(
            new ApiResponse(201, "Category created successfully", user)
        );
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating category")
    }
})

const updateCategory = asyncHandler(async (req, res) => {

    const id = req.params.id;

    const { error, value } = UpdateCategoryDetails.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, value, {
        new: true
    });

    if (!updatedCategory) {
        return res.status(404).json({
            success: false,
            message: "Category not found",
        });
    }

    return res.status(200).json(
        new ApiResponse(200, "Category updated successfully", updatedCategory)
    );
});

const getDefaultCategory = asyncHandler(async (req, res) => {

    const data = await Category.find({ user_id: null }).select("name is_default");

    return res
        .status(201)
        .json(
            new ApiResponse(200, "Category fetched successfully", data)
        )
})

const getCategoryList = asyncHandler(async (req, res) => {

    const data = await Category.find({ user_id: req.user?._id })

    return res
        .status(201)
        .json(
            new ApiResponse(200, "Category fetched successfully", data)
        )
})

const deleteCategory = asyncHandler(async (req, res) => {

    const record = await Category.findById(req?.params?.id)

    if (!record) {
        throw new ApiError(404, "Record not found")
    }

    const data = await Category.findByIdAndDelete(req?.params?.id)

    return res
        .status(201)
        .json(
            new ApiResponse(200, "Category deleted successfully", data)
        )
})


export {
    addCategory,
    getDefaultCategory,
    updateCategory,
    getCategoryList,
    deleteCategory
}