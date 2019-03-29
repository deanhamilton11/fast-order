<?php
/**
 * BSS Commerce Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://bsscommerce.com/Bss-Commerce-License.txt
 *
 * =================================================================
 *                 MAGENTO EDITION USAGE NOTICE
 * =================================================================
 * This package designed for Magento COMMUNITY edition
 * BSS Commerce does not guarantee correct work of this extension
 * on any other Magento edition except Magento COMMUNITY edition.
 * BSS Commerce does not provide extension support in case of
 * incorrect edition usage.
 * =================================================================
 *
 * @category   BSS
 * @package    Bss_FastOrder
 * @author     Extension Team
 * @copyright  Copyright (c) 2015-2016 BSS Commerce Co. ( http://bsscommerce.com )
 * @license    http://bsscommerce.com/Bss-Commerce-License.txt
 */
namespace Bss\FastOrder\Controller\Index;

class Csv extends \Magento\Framework\App\Action\Action
{
    protected $save;
    protected $cache;
    protected $pricingHelper;
    protected $fileUploaderFactory;
    protected $helperBss;

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\App\CacheInterface $cache,
        \Magento\Framework\Pricing\Helper\Data $pricingHelper,
        \Magento\MediaStorage\Model\File\UploaderFactory $fileUploaderFactory,
        \Bss\FastOrder\Helper\Data $helperBss,
        \Bss\FastOrder\Model\Search\Save $save
    ) {
        parent::__construct($context);
        $this->pricingHelper = $pricingHelper;
        $this->cache = $cache;
        $this->save = $save;
        $this->fileUploaderFactory = $fileUploaderFactory;
        $this->helperBss = $helperBss;
    }

    public function execute()
    {
        // csv function support only simple product not custom option

        $uploader = $this->fileUploaderFactory->create(['fileId' => 'file']);
        $file = $uploader->validateFile();
        if ($this->checkError($file)) {
            return;
        }
        $readCsv = trim(file_get_contents($file['tmp_name']));
        $csvLines = explode("\n", $readCsv);
        $delimiter = $this->_getDelimiter($csvLines[0]);
        $csvFirstLine = explode($delimiter, $csvLines[0]);
        if ($csvFirstLine[0] != 'sku' && $csvFirstLine[1] != 'qty') {
            $this->messageManager->addErrorMessage(__('The file\'s format is not correct. Please download sample csv file and try again.'));
            return;
        }
        array_shift($csvLines);
        // foreach row file csv
        $res = $this->getResponseCsv($csvLines);
        $skuNotSp = $res[0];
        $skuNotExist = $res[1];
        $result = $res[2];

        // mess error sku products not support
        if ($skuNotSp) {
            $verbs = 'is';
            $skuNotSp = rtrim($skuNotSp, '&nbsp;');
            $skuNotSp = rtrim($skuNotSp, ',');
            if (count(explode(',', $skuNotSp)) > 1) {
                $verbs = 'are';
            }
            $this->messageManager->addErrorMessage(
                __('CSV import is only available for simple product(s) without custom option(s). %1 %2 not supported.', $skuNotSp, $verbs)
            );
        }
        // mess error sku products not exist
        if ($skuNotExist) {
            $skuNotExist = rtrim($skuNotExist, '&nbsp;');
            $skuNotExist = rtrim($skuNotExist, ',');
            $this->messageManager->addErrorMessage(__('%1 do not match or do not exist on the site.', $skuNotExist));
        }
        $this->messageManager->addSuccessMessage(__('Import Complete.'));
        if (count($result) == 0) {
            $this->messageManager->addErrorMessage(__('No Item Imported.'));
        }
        $respon = json_encode($result);
        $this->getResponse()->setBody($respon);
        return;
    }

    protected function _getDelimiter($csvFirstLine)
    {
        $delimiter = ',';
        $delimiters = [',','\t',';','|',':'];
        foreach ($delimiters as $value) {
            if (strpos($csvFirstLine, $value) !== false) {
                $delimiter = $value;
                break;
            }
        }
        return $delimiter;
    }

    protected function getResponseCsv($csvLines = null)
    {
        $skuNotSp = '';
        $skuNotExist = '';
        $delimiter = $this->_getDelimiter($csvLines[0]);
        $result = [];
        foreach ($csvLines as $csvLine) {
            $arrLine = explode($delimiter, $csvLine);
            if (!$arrLine[0]) {
                continue;
            }
            $datalist = $this->save->getProductInfo($arrLine[0], true);
            if (!$datalist) {
                $skuNotExist .= $arrLine[0] . ',&nbsp;';
                continue;
            }
            $data = json_decode($datalist, true);
            if (!$arrLine[1]) {
                $arrLine[1] = 1;
            }
            if (!empty($data)) {
                $data[0]['qty'] = (float) $arrLine[1];
                $result[] = $data[0];
            }
        }
        $res = [$skuNotSp, $skuNotExist, $result];
        
        return $res;
    }

    protected function checkError($file = null)
    {
        if (!is_array($file) || empty($file)) {
            $this->messageManager->addErrorMessage(__('We can\'t import item to your table right now.'));
            return true;
        }

        if ($file['error'] > 0) {
            $this->messageManager->addErrorMessage(__('We can\'t import item to your table right now.'));
            return true;
        }
        if (pathinfo($file['name'], PATHINFO_EXTENSION) != 'csv') {
            $this->messageManager->addErrorMessage(__('The file\'s format is not correct. Please download sample csv file and try again.'));
            return true;
        }
        return false;
    }
}
