const asyncHandler = (requestHandler) => {
    if (typeof requestHandler !== "function") {
        throw new TypeError("asyncHandler expects a function")
    }

    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

export { asyncHandler }